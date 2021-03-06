/* eslint-disable prettier/prettier */
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Geometry from "@arcgis/core/geometry/Geometry";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import CodedValueDomain from "@arcgis/core/layers/support/CodedValueDomain";
import {
    geodesicBuffer,
    intersect,
    rotate,
    cut,
    planarLength,
    nearestCoordinate,
} from "@arcgis/core/geometry/geometryEngineAsync";
import * as Projection from "@arcgis/core/geometry/projection";
import UtilityNetwork from "@arcgis/core/networks/UtilityNetwork";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import TraceLocation from "@arcgis/core/rest/networks/support/TraceLocation";
import Polygon from "@arcgis/core/geometry/Polygon";

export interface NetworkGraphic {
    graphic: Graphic;
    layerId: number;
    traceLocations: TraceLocation[];
    label?: string;
}

export function createNetworkGraphic(
    point: Point,
    attributes: Record<string, number>,
    layer: FeatureLayer,
    percentAlong: number,
    type: "starting-point" | "barrier",
    isFilterBarrier?: boolean,
    terminalIds?: number[] | undefined,

): NetworkGraphic {
    //Esri geodatabase fields have inconsistant case.  Find the name of the global id field regardless of case.
    const globalIdKey = getKey(attributes, "globalid");

    //We should never get here but just in case.
    if (!globalIdKey) {
        throw Error("No Global Id field found in feature attributes.");
    }
    const globalId = getValue(attributes, globalIdKey);

    //Esri geodatabase fields have inconsistant case.  Find the name of the asset type field regardless of case.
    const assetTypeField = getKey(attributes, "assettype");
    //We should never get here but just in case.
    if (!assetTypeField) {
        throw Error("No Asset Type field found in feature attributes.");
    }

    //Esri geodatabase fields have inconsistant case.  Find the name of the global id field regardless of case.
    const objectIdField = getKey(attributes, "objectId");
    //We should never get here but just in case.
    if (!objectIdField) {
        throw Error("No Object Id field found in feature attributes.");
    }
    const objectId: number = attributes[objectIdField];

    const flagPoint = point.clone();

    const graphic = new Graphic({
        geometry: flagPoint,
        attributes: attributes,
        layer: layer,
    });
    let label;
    //Get the coded domain value for the label.
    const assetTypeDomain = getCodedDomain(graphic, assetTypeField, layer);
    if (assetTypeDomain != undefined && assetTypeDomain != null) {
        const assetTypeCode = graphic.attributes[assetTypeField];
        if (assetTypeCode != undefined && assetTypeCode != null) {
            const codedVal = assetTypeDomain.getName(graphic.attributes[assetTypeField]);
            if (codedVal != undefined) {
                label = `${layer.title} (${codedVal}) : ${objectId}`;
            }
        }
    } else {
        label = `${layer.title} : ${objectId}`;
    }
    const networkGraphic = {
        graphic: graphic,
        layerId: layer.layerId,
        label,
    } as NetworkGraphic;

    if (terminalIds) {
        const traceLocations: TraceLocation[] = [];
        for (let i = 0; i < terminalIds.length; i++) {

            const terminalId: number = terminalIds[i];
            const traceLocation = new TraceLocation({
                globalId,
                isFilterBarrier,
                percentAlong,
                terminalId,
                type,

            });
            traceLocations.push(traceLocation);
        }
        networkGraphic.traceLocations = traceLocations;
    } else {
        networkGraphic.traceLocations = [
            new TraceLocation({
                globalId,
                isFilterBarrier,
                percentAlong,
                type,
            })
        ]

    }
    return networkGraphic;
}

export function getTerminalIds(graphic: Graphic, utilityNetwork: UtilityNetwork): number[] {

    const terminalIds: number[] = [];
    //Esri geodatabase fields have inconsistant case.  Find the name of the asset type field regardless of case.
    const assetTypeField = getKey(graphic.attributes, "assettype");
    //We should never get here but just in case.
    if (!assetTypeField) {
        throw Error("No Asset Type field found in feature attributes.");
    }
    //Esri geodatabase fields have inconsistant case.  Find the name of the asset type field regardless of case.
    const assetGroupField = getKey(graphic.attributes, "assetgroup");
    if (!assetGroupField) {
        throw Error("No Asset Group field found in feature attributes.");
    }
    const junctionIds = (utilityNetwork as any).dataElement.domainNetworks.map(
        (dn) => {
            return dn.junctionSources.map((js) => js.layerId);
        }
    );
    const flattenedJunctionIds = flattenArrays(junctionIds);

    if (flattenedJunctionIds.find(id => id === (graphic.layer as FeatureLayer).layerId)) {
        const assetType = getAssetType((graphic.layer as FeatureLayer).layerId, graphic.attributes[assetGroupField], graphic.attributes[assetTypeField], utilityNetwork);
        if (assetType) {
            const terminalConfigurations = getTerminalConfiguration(assetType.terminalConfigurationId, utilityNetwork);
            for (const terminal of terminalConfigurations.terminals) {
                terminalIds.push(terminal.terminalId);
            };
        }

    }
    return terminalIds;
}

export function getValue(obj: Record<string, number>, prop: string): any {
    prop = prop.toString().toLowerCase();
    for (const p in obj) {
        if (
            Object.prototype.hasOwnProperty.call(obj, p) &&
            prop == p.toString().toLowerCase()
        ) {
            return obj[p];
        }
    }
    return undefined;
}
export async function splitPolyline(sourceLine: Polyline, flagGeom: Point): Promise<Polyline[]> {

    let splitLines: Polyline[] = [];
    const line = sourceLine.clone();
    const projectedLine = Projection.project(
        line,
        flagGeom.spatialReference
    ) as Polyline;
    const snappedPoint = await getPolylineIntersection(projectedLine, flagGeom);
    const buffer = (await geodesicBuffer(snappedPoint, 20, "feet")) as Polygon;
    const polyIntersection = await intersect(projectedLine, buffer);
    if (polyIntersection) {
        const rotated = await rotate(polyIntersection, 90);
        const newGeom = await cut(projectedLine, rotated as Polyline);
        if (newGeom.length > 0) {
            splitLines = newGeom as Polyline[];
        }
    }
    return splitLines;
}

export async function getPolylineIntersection(sourceLine: Polyline, flagGeom: Point): Promise<Point> {
    let intersectionPoint;
    const nearestCoord = await nearestCoordinate(sourceLine, flagGeom);
    if (nearestCoord.coordinate) {
        intersectionPoint =  nearestCoord.coordinate;
    }

    return intersectionPoint;
}

export async function getPercentageAlong(
    sourceGeom: Geometry,
    flagGeom: Point
): Promise<number> {
    let percentage = 0.0;

    if (!(sourceGeom.type == "polyline")) {
        return percentage;
    } else {
        percentage = 0.5;
    }
    const sourceLine = sourceGeom as Polyline;
    const splitGeom = await splitPolyline(sourceLine, flagGeom);


    if (splitGeom.length > 0) {
        const sourceLength = await planarLength(sourceLine, "feet");

        let pieceLength;
        if (
            splitGeom[0].paths[0][0][0] == sourceLine.paths[0][0][0] &&
            splitGeom[0].paths[0][0][1] == sourceLine.paths[0][0][1]
        ) {
            pieceLength = await planarLength(splitGeom[0], "feet");
        } else {
            pieceLength = await planarLength(splitGeom[1], "feet");
        }
        percentage = pieceLength / sourceLength;
    }

    return percentage;
}

//create a polyline to use tor percentage along calculation
export function createPolyline(
    paths: number[][][],
    inSR: SpatialReference
): Polyline {
    const newLine = new Polyline({
        hasZ: false,
        hasM: false,
        paths: paths,
        spatialReference: inSR.clone(),
    });
    return newLine;
}

export function getNetworkLayerIds(utilityNetwork: UtilityNetwork): any[] {
    const edgeIds = (utilityNetwork as any).dataElement.domainNetworks.map(
        (dn) => {
            return dn.edgeSources.map((js) => js.layerId);
        }
    );
    const junctionIds = (utilityNetwork as any).dataElement.domainNetworks.map(
        (dn) => {
            return dn.junctionSources.map((js) => js.layerId);
        }
    );
    const flatEdgeIds = flattenArrays(edgeIds);
    const flatJunctionIds = flattenArrays(junctionIds);
    return flatJunctionIds.concat(flatEdgeIds);
}

export function flattenArrays(arr: any[]): any[] {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(
            Array.isArray(toFlatten) ? flattenArrays(toFlatten) : toFlatten
        );
    }, []);
}

export function getCodedDomain(
    graphic: Graphic,
    field: string,
    layer: FeatureLayer
): CodedValueDomain | undefined {

    let domain;

    const subtypeField = layer.sourceJSON.subtypeField;

    if (subtypeField != undefined && subtypeField != null) {
        const subTypeValue = graphic.attributes[subtypeField];
        if (subTypeValue != undefined && subTypeValue != null) {
            const subType = layer.sourceJSON.subtypes.find(sub => sub.code == subTypeValue);
            if (subType != undefined && subType != null) {
                domain = subType.domains[field];
            }
        }
    }
    if (!domain) {
        domain = domainOf(layer, field);
    }
    /* Subtypes are not instantiated CodedValueDomain objects - just JSON so 
     * we need to check to ensure we return an instaiated class when it is defined
    */
    if (domain != undefined && !(domain instanceof CodedValueDomain)) {
        return CodedValueDomain.fromJSON(domain);
    }
    return domain;
}

function domainOf(layer: FeatureLayer, field: string): CodedValueDomain | undefined {
    let domain;
    const fields = layer.fields;
    if (fields instanceof Array) {
        for (const f of fields) {
            if (f.name === field) {
                domain = f.domain as CodedValueDomain;
                if (domain !== undefined && domain !== null) {
                    const codedValues = domain.codedValues;
                    if (codedValues instanceof Array) {
                        break;
                    }
                }
            }
        }
    }

    return domain;
}

export function getKey(object: Record<string, unknown>, key: string): any {
    return Object.keys(object).find(
        (k) => k.toLowerCase() === key.toLowerCase()
    );
}


export function getAssetType(layerId: number, assetGroupCode: number, assetTypeCode: number, utilityNetwork: UtilityNetwork): any {

    const domainNetworks = (utilityNetwork as any).dataElement.domainNetworks;

    for (let i = 0; i < domainNetworks.length; i++) {
        const domainNetwork = domainNetworks[i];
        for (let j = 0; j < domainNetwork.junctionSources.length; j++)
            if (domainNetwork.junctionSources[j].layerId == layerId) {
                const assetGroup = domainNetwork.junctionSources[j].assetGroups.find(ag => ag.assetGroupCode === assetGroupCode);
                if (assetGroup instanceof Object) {
                    const assetType = assetGroup.assetTypes.find(at => at.assetTypeCode === assetTypeCode);
                    assetType.assetGroupName = assetGroup.assetGroupName;
                    assetType.utilityNetworkFeatureClassUsageType = domainNetwork.junctionSources[j].utilityNetworkFeatureClassUsageType;
                    if (assetType instanceof Object) return assetType;
                }
            }

        for (let j = 0; j < domainNetwork.edgeSources.length; j++)
            if (domainNetwork.edgeSources[j].layerId == layerId) {
                const assetGroup = domainNetwork.edgeSources[j].assetGroups.find(ag => ag.assetGroupCode === assetGroupCode);
                if (assetGroup instanceof Object) {
                    const assetType = assetGroup.assetTypes.find(at => at.assetTypeCode === assetTypeCode);
                    assetType.assetGroupName = assetGroup.assetGroupName;
                    assetType.utilityNetworkFeatureClassUsageType = domainNetwork.edgeSources[j].utilityNetworkFeatureClassUsageType;
                    if (assetType instanceof Object) return assetType;
                }
            }
    }

    return undefined;
}

export function getTerminalConfiguration(terminalConfigurationId: number, utilityNetwork: UtilityNetwork): any {
    const dataElement = (utilityNetwork as any).dataElement;
    return dataElement.terminalConfigurations.find(tc => tc.terminalConfigurationId === terminalConfigurationId);
}

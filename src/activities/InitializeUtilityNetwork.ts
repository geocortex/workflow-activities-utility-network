import type {
    IActivityHandler,
    IActivityContext,
} from "@geocortex/workflow/runtime/IActivityHandler";
import UtilityNetwork from "@arcgis/core/networks/UtilityNetwork";
import WebMap from "@arcgis/core/WebMap";
import IdentityManager from "@arcgis/core/identity/IdentityManager";
import Credential from "@arcgis/core/identity/Credential";
import Network from "@arcgis/core/networks/Network";
import { MapProvider } from "@geocortex/workflow/runtime/activities/arcgis/MapProvider";
import { utils } from "./utils";
import { activate } from "@geocortex/workflow/runtime/Hooks";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

/** An interface that defines the outputs of the activity. */
export interface InitializeUtilityNetworkOutputs {
    /**
     * @description The initialized Utility Network.
     */
    result: UtilityNetwork | undefined;
    utilityNetworks: UtilityNetwork[] | undefined;
    utils: {
        getUtilityNetworkFromGraphic: (
            utilityNetworks: UtilityNetwork[],
            graphic: Graphic
        ) => Promise<UtilityNetwork>;
        getAssetDomain: (
            assetGroupCode: number,
            assetTypeCode: number,
            utilityNetwork: UtilityNetwork
        ) => any;
        getAssetSource: (
            assetGroupCode: number,
            assetTypeCode: number,
            domainNetwork: any
        ) => any;
        getAssetGroup: (assetGroupCode: number, assetSource: any) => any;
        getAssetType: (assetTypeCode: number, assetGroup: any) => any;
        getWebMapLayerByAsset: (
            asset: any,
            layerId: number,
            map: WebMap,
            utilityNetwork: UtilityNetwork
        ) => Promise<FeatureLayer>;
        getLayerIdByAsset: (
            assetSourceId: number,
            utilityNetwork: UtilityNetwork
        ) => number;
        getWebMapLayersByAssets: (
            assets: any[],
            map: WebMap,
            utilityNetwork: UtilityNetwork
        ) => Promise<any>;
        isInTier: (
            assetGroupCode: number,
            assetTypeCode: number,
            tier: any
        ) => boolean;
    };
}

/**
 * @category Utility Network
 * @defaultName initUtilityNetwork
 * @description Initializes the Utility Networks from the given web map. Returns the first utility network
 * as well as the complete array of utility networks.
 * @helpUrl https://developers.arcgis.com/javascript/latest/api-reference/esri-networks-UtilityNetwork.html
 * @clientOnly
 * @unsupportedApps GMV, GVH, WAB
 */
@activate(MapProvider)
export class InitializeUtilityNetwork implements IActivityHandler {
    async execute(
        inputs: unknown,
        context: IActivityContext,
        type: typeof MapProvider
    ): Promise<InitializeUtilityNetworkOutputs> {
        const mapProvider = type.create();
        await mapProvider.load();
        if (!mapProvider.map) {
            throw new Error("map is required");
        }
        const map = mapProvider.map as WebMap;
        let utilityNetworks: __esri.Collection<UtilityNetwork>;
        const portalItem = map.portalItem as any;
        if (map.utilityNetworks) {
            utilityNetworks = map.utilityNetworks;
        } else {
            const portalOauthInfo = this.getOauthInfo(
                portalItem.portal.credential
            );
            IdentityManager.registerToken(portalOauthInfo);
            const webmap = new WebMap({
                portalItem: {
                    id: portalItem.id,
                    portal: { url: portalItem.portal.url },
                },
            });

            await webmap.load();
            if (webmap.utilityNetworks?.length > 0) {
                utilityNetworks = webmap.utilityNetworks;
                for (let i = 0; i < utilityNetworks.length; i++) {
                    const agsOauthInfo = this.getOauthInfo(
                        portalItem.portal.credential,
                        (utilityNetworks.getItemAt(i) as unknown as Network)
                            .networkServiceUrl
                    );
                    IdentityManager.registerToken(agsOauthInfo);
                }
            } else {
                throw new Error("Utility network not found.");
            }
        }
        for (let i = 0; i < utilityNetworks.length; i++) {
            await utilityNetworks.getItemAt(i).load();
        }

        return {
            result: utilityNetworks.getItemAt(0),
            utilityNetworks: utilityNetworks.toArray(),
            utils: utils,
        };
    }
    getOauthInfo(credential: Credential, server?: string): any {
        let token;
        try {
            token = {
                expires: credential.expires,
                server: server ? server : credential.server,
                ssl: true,
                token: credential.token,
                userId: credential.userId,
            };
        } catch (e) {
            throw new Error("Unable to access user info.");
        }
        return token;
    }
}

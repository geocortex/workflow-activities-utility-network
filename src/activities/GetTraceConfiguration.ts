import type { IActivityHandler } from "@geocortex/workflow/runtime/IActivityHandler";
import UtilityNetwork from "@arcgis/core/networks/UtilityNetwork";
import UNTraceConfiguration from "@arcgis/core/networks/support/UNTraceConfiguration";
import NamedTraceConfiguration from "@arcgis/core/networks/support/NamedTraceConfiguration";

/** An interface that defines the inputs of the activity. */
export interface GetTraceConfigurationInputs {
    /**
     * @displayName Utility Network
     * @description The Utility Network object for the target service.
     * @required
     */
    utilityNetwork: UtilityNetwork;

    /**
     * @displayName Trace Configuration Id
     * @description The GUID or Title that uniquely identifies the shared trace configuration to be loaded.
     * @required
     */
    traceId: string;
}

/** An interface that defines the outputs of the activity. */
export interface GetTraceConfigurationOutputs {
    /**
     * @description The trace configurations associated with the Utility Network results.
     */
    traceConfiguration: UNTraceConfiguration;
}

/**
 * @category Utility Network
 * @description Get the Trace Configurations associated with a Utility Network.
 * @helpUrl https://developers.arcgis.com/javascript/latest/api-reference/esri-networks-support-TraceConfiguration.html
 * @clientOnly
 * @unsupportedApps GMV, GVH
 */
export class GetTraceConfigurations implements IActivityHandler {
    execute(inputs: GetTraceConfigurationInputs): GetTraceConfigurationOutputs {
        const { utilityNetwork, traceId } = inputs;
        if (!utilityNetwork) {
            throw new Error("utilityNetwork is required");
        }
        if (!traceId) {
            throw new Error("traceId is required");
        }
        let traceConfiguration: NamedTraceConfiguration;

        const namedTraceConfiguration = utilityNetwork.sharedNamedTraceConfigurations.find(
            (x) => x.title === traceId || x.globalId === traceId
        );

        if (namedTraceConfiguration != undefined) {
            traceConfiguration = new UNTraceConfiguration(
                namedTraceConfiguration.traceConfiguration.toJSON()
            );
            return {
                traceConfiguration: traceConfiguration,
            };
        }

        return {
            traceConfiguration: null,
        };
    }
}
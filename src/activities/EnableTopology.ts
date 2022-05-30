import type {
    IActivityHandler,
    IActivityContext,
} from "@geocortex/workflow/runtime/IActivityHandler";
import UtilityNetwork from "esri/networks/UtilityNetwork";
import Network from "@arcgis/core/networks/Network";
import { activate } from "@geocortex/workflow/runtime/Hooks";
import { ChannelProvider } from "@geocortex/workflow/runtime/activities/core/ChannelProvider";

/** An interface that defines the inputs of the activity. */
interface EnableTopologyInputs {
    /**
     * @displayName Utility Network
     * @description The Utility Network object for the target service.
     * @required
     */
    utilityNetwork: Network & UtilityNetwork;
    /**
     * @displayName maxErrorCount
     * @description Optional parameter specifying when the process of enabling the network topology will stop if the maximum number of errors is met.
     */
    maxErrorCount?: number;
}

/** An interface that defines the outputs of the activity. */
interface EnableTopologyOutputs {
    result: {
        moment: Date;
        success: boolean;
        error: {
            extendedCode: any;
            message: string;
            details: string[];
        };
    };
}

/**
 * @category Utility Network
 * @displayName EnableTopology
 * @description Enabling the network topology for a utility network is done on the DEFAULT version.
 * Enabling is not supported in named versions. When the topology is enabled, all feature and association edits generate dirty areas,
 * which are then consumed when the network topology is updated.
 * @clientOnly
 * @unsupportedApps GMV, GVH, WAB
 */
@activate(ChannelProvider)
export default class EnableTopologyActivity implements IActivityHandler {
    /** Perform the execution logic of the activity. */
    async execute(
        inputs: EnableTopologyInputs,
        context: IActivityContext,
        type: typeof ChannelProvider
    ): Promise<EnableTopologyOutputs> {
        const { utilityNetwork, ...other } = inputs;

        if (!utilityNetwork) {
            throw new Error("utilityNetwork is required");
        }

        const channel = type.create(undefined, "arcgis");
        channel.request.url = `${utilityNetwork.networkServiceUrl}/enableTopology/`;
        channel.request.method = "POST";
        channel.request.json = {
            f: "json",
            async: false,
            ...other,
        };
        context.cancellationToken.finally(function () {
            channel.cancel();
        });
        await channel.send();
        const payload =
            channel.response.payload &&
            (channel.getResponseData(channel.response.payload) as any);
        if (payload && payload.success) {
            return {
                result: payload,
            };
        } else if (channel.response?.error) {
            throw channel.response.error;
        } else {
            throw new Error("An error occurred when enabling topology.");
        }
    }
}

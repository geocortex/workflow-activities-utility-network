import type {
    IActivityHandler,
    IActivityContext,
} from "@geocortex/workflow/runtime/IActivityHandler";
import UtilityNetwork from "esri/networks/UtilityNetwork";
import Network from "@arcgis/core/networks/Network";
import { activate } from "@geocortex/workflow/runtime/Hooks";
import { ChannelProvider } from "@geocortex/workflow/runtime/activities/core/ChannelProvider";

/** An interface that defines the inputs of the activity. */
interface DisableTopologyInputs {
    /**
     * @displayName Utility Network
     * @description The Utility Network object for the target service.
     * @required
     */
    utilityNetwork: Network & UtilityNetwork;
    /**
     * @displayName gdbVersion
     * @description Optional parameter specifying the name of the geodatabase version.
     */
    gdbVersion?: string;

    /**
     * @displayName sessionID
     * @description Optional parameter specifying the token (GUID) used to lock the version.
     * If the calling client is editing a named version, the sessionId must be provided;
     * if the client is editing DEFAULT, the version may not be locked and the sessionId should not be specified.
     */
    sessionID?: string;
}

/** An interface that defines the outputs of the activity. */
interface DisableTopologyOutputs {
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
 * @displayName DisableTopology
 * @description Disables the network topology for a utility network. When the topology is disabled,
 * feature and association edits do not generate dirty areas. Analytics and diagram generation can't be performed if the topology is not present.
 * @clientOnly
 * @unsupportedApps GMV, GVH, WAB
 */
@activate(ChannelProvider)
export default class DisableTopologyActivity implements IActivityHandler {
    /** Perform the execution logic of the activity. */
    async execute(
        inputs: DisableTopologyInputs,
        context: IActivityContext,
        type: typeof ChannelProvider
    ): Promise<DisableTopologyOutputs> {
        const { utilityNetwork, ...other } = inputs;

        if (!utilityNetwork) {
            throw new Error("utilityNetwork is required");
        }

        const channel = type.create(undefined, "arcgis");
        channel.request.url = `${utilityNetwork.networkServiceUrl}/disableTopology/`;
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
            throw new Error("An error occurred when disabling topology.");
        }
    }
}

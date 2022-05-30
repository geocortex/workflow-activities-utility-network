import type {
    IActivityHandler,
    IActivityContext,
} from "@geocortex/workflow/runtime/IActivityHandler";
import Extent from "@arcgis/core/geometry/Extent";
import UtilityNetwork from "esri/networks/UtilityNetwork";
import Network from "@arcgis/core/networks/Network";
import { activate } from "@geocortex/workflow/runtime/Hooks";
import { ChannelProvider } from "@geocortex/workflow/runtime/activities/core/ChannelProvider";
/** An interface that defines the inputs of the activity. */
interface ValidateNetworkTopologyInputs {
    /**
     * @displayName Utility Network
     * @description The Utility Network object for the target service.
     * @required
     */
    utilityNetwork: Network & UtilityNetwork;

    /**
     * @displayName validateArea
     * @description  The extent of the area to validate.
     * @required
     */
    validateArea: Extent;

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

    /**
     * @displayName validationType
     * @description  Optional parameter that specifies the type of validation to perform.
     * The default is normal. With the repair validationType, the specified portions of the network index are reconstructed from scratch.
     */
    validationType?: "normal" | "rebuild" | "forceRebuild";

    /**
     * @displayName validationSet
     * @description  Optional parameter that specifies the set of features and objects to validate.
     */
    validationSet?: any;

    /**
     * @displayName returnEdits
     * @description  Optional Boolean parameter that returns edited features.
     * Returned results are organized in a layer-by-layer fashion. If returnEdits is set
     * to true, each layer may have edited features returned in an editedFeatures object.
     */
    returnEdits?: boolean;
}

/** An interface that defines the outputs of the activity. */
interface ValidateNetworkTopologyOutputs {
    /**
     * @description The result of the activity.
     */
    result: {
        moment: Date;
        fullUpdate: boolean;
        validateErrorsCreated: boolean;
        dirtyAreaCount: number;
        exceededTransferLimit: boolean;
        serviceEdits: {
            id: number;
            editedFeatures: {
                adds: [];
                updates: [];
                deletes: [];
            };
        }[];
        success: boolean;
        error: {
            extendedCode: any;
            message: string;
            details: string[];
        };
    };
}

/**
 * @displayName ValidateNetworkTopology
 * @category Utility Network
 * @description Validates the network topology for a utility network to maintain consistency between feature editing space and network topology space.
 *              Validating a network topology may include all or a subset of the dirty areas present in the network.
 * @clientOnly
 * @unsupportedApps GMV, GVH, WAB
 */

@activate(ChannelProvider)
export default class ValidateNetworkTopologyActivity
    implements IActivityHandler
{
    /** Perform the execution logic of the activity. */
    async execute(
        inputs: ValidateNetworkTopologyInputs,
        context: IActivityContext,
        type: typeof ChannelProvider
    ): Promise<ValidateNetworkTopologyOutputs> {
        const { utilityNetwork, validateArea, ...other } = inputs;

        if (!utilityNetwork) {
            throw new Error("utilityNetwork is required");
        }

        if (!validateArea) {
            throw new Error("Validation area required.");
        }

        const channel = type.create(undefined, "arcgis");
        channel.request.url = `${utilityNetwork.networkServiceUrl}/validateNetworkTopology/`;
        channel.request.method = "POST";
        channel.request.json = {
            f: "json",
            validateArea: validateArea.toJSON(),
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
            throw new Error("An error occurred when validating topology.");
        }
    }
}

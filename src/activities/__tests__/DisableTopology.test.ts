import EnableTopologyActivity from "../EnableTopology";
import UtilityNetwork from "@arcgis/core/networks/UtilityNetwork";
import { mockActivityContext } from "../__mocks__/ActivityContext";
const mockMapProvider = jest.fn();

const mockResult = {
    moment: 123456,
    success: true,
    error: new Error("Mock error"),
};

const mockProvider = {
    create: (type, channelType) => {
        return {
            cancel: jest.fn(),
            send: jest.fn(),
            request: () => {
                return {
                    url: "",
                    method: "",
                    json: {},
                };
            },
            response: {
                payload: {
                    moment: 123456,
                    success: true,
                },
            },
            getResponseData: (payload: any) => {
                return mockResult;
            },
        };
    },
};

jest.mock("@arcgis/core/networks/UtilityNetwork", () => {
    return function () {
        return {
            load: jest.fn(),
            url: "https://test/url",
        };
    };
});
const mockUn = new UtilityNetwork();

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Disable Network Topology", () => {
    describe("execute", () => {
        it("requires utilityNetwork input", async () => {
            const activity = new EnableTopologyActivity();
            await expect(async () => {
                await activity.execute(
                    {
                        utilityNetwork: undefined as any,
                    },
                    context,
                    mockProvider as any
                );
            }).rejects.toThrow("utilityNetwork is required");
        });
        const context = mockActivityContext();
        it("Disables a UN topology that is in an enabled state", async () => {
            const activity = new EnableTopologyActivity();
            const inputs = {
                utilityNetwork: mockUn,
            };
            const mockSucessResponse = {
                moment: 123456,
                success: true,
                error: new Error("Mock error"),
            };

            const successResult = await activity.execute(
                inputs as any,
                context,
                mockProvider as any
            );
            expect(successResult).toStrictEqual({
                result: mockSucessResponse,
            });
        });
    });
});

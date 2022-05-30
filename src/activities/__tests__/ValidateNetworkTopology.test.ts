import UtilityNetwork from "@arcgis/core/networks/UtilityNetwork";
import Extent from "@arcgis/core/geometry/Extent";
import Network from "@arcgis/core/networks/Network";
import { mockActivityContext } from "../__mocks__/ActivityContext";
import ValidateNetworkTopology from "../ValidateNetworkTopology";
const mockMapProvider = jest.fn();

const mockResult = {
    moment: 12345,
    fullUpdate: true,
    validateErrorsCreated: false,
    dirtyAreaCount: 1,
    exceededTransferLimit: false,
    serviceEdits: {
        id: 123,
        editedFeatures: {
            spatialReference: {
                wkid: 3498,
                latestWkid: 3498,
                xyTolerance: 0.0032808333333333331,
                zTolerance: 0.001,
                mTolerance: 0.001,
                falseX: -117608900,
                falseY: -91881400,
                xyUnits: 3048.00609601219276,
                falseZ: -100000,
                zUnits: 10000,
                falseM: -100000,
                mUnits: 10000,
            },
            adds: [],
            updates: [],
            deletes: [
                {
                    attributes: {
                        objectid: 4426,
                        isretired: 1,
                        status: null,
                        sourceid: 7,
                        guid: "{693652D5-A21B-47D1-B416-9452F60EC399}",
                        updatetype: 1,
                        creationdate: 1565614408000,
                        creator: "jwilson",
                        lastupdate: 1565614408000,
                        updatedby: "jwilson",
                        globalid: "{FFF05EA7-7A11-484C-A6F5-5103E8AE99F0}",
                        Shape__Area: 4883.66339633075313,
                        Shape__Length: 434.559498333333238,
                    },
                    geometry: {
                        hasZ: true,
                        hasM: true,
                        rings: [
                            [
                                [
                                    6810561.460448131,
                                    1846168.57139080763,
                                    0,
                                    null,
                                ],
                                [
                                    6810561.460448131,
                                    1846360.39154522121,
                                    0,
                                    null,
                                ],
                                [
                                    6810586.92004288733,
                                    1846360.39154522121,
                                    0,
                                    null,
                                ],
                                [
                                    6810586.92004288733,
                                    1846168.57139080763,
                                    0,
                                    null,
                                ],
                                [
                                    6810561.460448131,
                                    1846168.57139080763,
                                    0,
                                    null,
                                ],
                            ],
                        ],
                    },
                },
            ],
        },
    },
    success: true,
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
jest.mock("@arcgis/core/geometry/Extent", () => {
    return function () {
        return {
            toJSON: () => {
                return {
                    xmin: 0,
                    ymin: 0,
                    xmax: 1,
                    ymax: 1,
                    spatialReference: {
                        wkid: 3857,
                    },
                };
            },
        };
    };
});
const mockArea = new Extent();
beforeEach(() => {
    jest.clearAllMocks();
});

describe("Validate Network Topology", () => {
    describe("execute", () => {
        it("requires utilityNetwork input", async () => {
            const activity = new ValidateNetworkTopology();
            await expect(async () => {
                await activity.execute(
                    {
                        utilityNetwork: undefined as any,
                        validateArea: mockArea,
                    },
                    context,
                    mockProvider as any
                );
            }).rejects.toThrow("utilityNetwork is required");
        });
        it("requires utilityNetwork input", async () => {
            const activity = new ValidateNetworkTopology();
            await expect(async () => {
                await activity.execute(
                    {
                        utilityNetwork: mockUn as Network & UtilityNetwork,
                        validateArea: undefined as any,
                    },
                    context,
                    mockProvider as any
                );
            }).rejects.toThrow("Validation area required.");
        });
        const context = mockActivityContext();
        it("Enables a UN topology that is in a disabled state", async () => {
            const activity = new ValidateNetworkTopology();
            const inputs = {
                utilityNetwork: mockUn as Network & UtilityNetwork,
                validateArea: mockArea,
            };
            const mockSucessResponse = {
                moment: 12345,
                fullUpdate: true,
                validateErrorsCreated: false,
                dirtyAreaCount: 1,
                exceededTransferLimit: false,
                serviceEdits: {
                    id: 123,
                    editedFeatures: {
                        spatialReference: {
                            wkid: 3498,
                            latestWkid: 3498,
                            xyTolerance: 0.0032808333333333331,
                            zTolerance: 0.001,
                            mTolerance: 0.001,
                            falseX: -117608900,
                            falseY: -91881400,
                            xyUnits: 3048.00609601219276,
                            falseZ: -100000,
                            zUnits: 10000,
                            falseM: -100000,
                            mUnits: 10000,
                        },
                        adds: [],
                        updates: [],
                        deletes: [
                            {
                                attributes: {
                                    objectid: 4426,
                                    isretired: 1,
                                    status: null,
                                    sourceid: 7,
                                    guid: "{693652D5-A21B-47D1-B416-9452F60EC399}",
                                    updatetype: 1,
                                    creationdate: 1565614408000,
                                    creator: "jwilson",
                                    lastupdate: 1565614408000,
                                    updatedby: "jwilson",
                                    globalid:
                                        "{FFF05EA7-7A11-484C-A6F5-5103E8AE99F0}",
                                    Shape__Area: 4883.66339633075313,
                                    Shape__Length: 434.559498333333238,
                                },
                                geometry: {
                                    hasZ: true,
                                    hasM: true,
                                    rings: [
                                        [
                                            [
                                                6810561.460448131,
                                                1846168.57139080763,
                                                0,
                                                null,
                                            ],
                                            [
                                                6810561.460448131,
                                                1846360.39154522121,
                                                0,
                                                null,
                                            ],
                                            [
                                                6810586.92004288733,
                                                1846360.39154522121,
                                                0,
                                                null,
                                            ],
                                            [
                                                6810586.92004288733,
                                                1846168.57139080763,
                                                0,
                                                null,
                                            ],
                                            [
                                                6810561.460448131,
                                                1846168.57139080763,
                                                0,
                                                null,
                                            ],
                                        ],
                                    ],
                                },
                            },
                        ],
                    },
                },
                success: true,
            };
            const successResult = await activity.execute(
                inputs as any,
                context,
                mockProvider as any
            );
            expect(successResult).toEqual({
                result: mockResult,
            });
        });
    });
});

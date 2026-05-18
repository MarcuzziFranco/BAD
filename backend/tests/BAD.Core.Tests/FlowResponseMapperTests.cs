using BAD.Core.Flow;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Tests;

public class FlowResponseMapperTests
{
    [Fact]
    public void BuildMergedBase_DiamondNode_MergesTwoParents()
    {
        var parentDict = new Dictionary<string, JObject?>
        {
            ["na"] = JObject.Parse("""{"outA":42}"""),
            ["nb"] = JObject.Parse("""{"nested":{"outB":"hello"}}""")
        };
        var mappings = new List<FlowInputMappingV1>
        {
            new()
            {
                FromNodeId = "na",
                SourcePath = "outA",
                TargetPath = "fromA"
            },
            new()
            {
                FromNodeId = "nb",
                SourcePath = "nested.outB",
                TargetPath = "payload.fromB"
            }
        };

        var merged = FlowResponseMapper.BuildMergedBase("""{"payload":{"x":1}}""", parentDict, mappings);
        Assert.Equal(42, (int)merged["fromA"]!);
        Assert.Equal("hello", (string)merged["payload"]!["fromB"]!);
        Assert.Equal(1, (int)merged["payload"]!["x"]!);
    }

    [Fact]
    public void NormalizeJsonPath_StripsDollarPrefix()
    {
        Assert.Equal("a.b", FlowResponseMapper.NormalizeJsonPath("$.a.b"));
    }
}

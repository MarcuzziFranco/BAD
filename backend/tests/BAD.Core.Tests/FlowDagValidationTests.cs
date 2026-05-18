using BAD.Core.Flow;

namespace BAD.Core.Tests;

public class FlowDagValidationTests
{
    [Fact]
    public void TopologicalOrder_Diamond_A_Then_B_C_Then_D()
    {
        var def = new FlowDefinitionV1
        {
            Nodes =
            [
                new FlowNodeV1 { Id = "A", Step = new FlowStepV1 { RequestConfigId = 1 } },
                new FlowNodeV1 { Id = "B", Step = new FlowStepV1 { RequestConfigId = 1 } },
                new FlowNodeV1 { Id = "C", Step = new FlowStepV1 { RequestConfigId = 1 } },
                new FlowNodeV1 { Id = "D", Step = new FlowStepV1 { RequestConfigId = 1 } },
            ],
            Edges =
            [
                new FlowEdgeV1 { Source = "A", Target = "B" },
                new FlowEdgeV1 { Source = "A", Target = "C" },
                new FlowEdgeV1 { Source = "B", Target = "D" },
                new FlowEdgeV1 { Source = "C", Target = "D" },
            ]
        };

        var order = FlowDagValidation.TopologicalOrder(def).ToList();
        Assert.Equal("A", order[0]);
        Assert.True(order.IndexOf("B") < order.IndexOf("D"));
        Assert.True(order.IndexOf("C") < order.IndexOf("D"));
    }

    [Fact]
    public void TopologicalOrder_Cycle_Throws()
    {
        var def = new FlowDefinitionV1
        {
            Nodes =
            [
                new FlowNodeV1 { Id = "A", Step = new FlowStepV1 { RequestConfigId = 1 } },
                new FlowNodeV1 { Id = "B", Step = new FlowStepV1 { RequestConfigId = 1 } },
            ],
            Edges =
            [
                new FlowEdgeV1 { Source = "A", Target = "B" },
                new FlowEdgeV1 { Source = "B", Target = "A" },
            ]
        };

        Assert.Throws<FlowDefinitionException>(() => FlowDagValidation.TopologicalOrder(def));
    }

    [Fact]
    public void Validate_MappingFromNonParent_ReturnsError()
    {
        var def = new FlowDefinitionV1
        {
            Nodes =
            [
                new FlowNodeV1
                {
                    Id = "A",
                    Step = new FlowStepV1 { RequestConfigId = 1 }
                },
                new FlowNodeV1
                {
                    Id = "B",
                    Step = new FlowStepV1
                    {
                        RequestConfigId = 1,
                        InputMappings =
                        [
                            new FlowInputMappingV1 { FromNodeId = "X", SourcePath = "a", TargetPath = "b" }
                        ]
                    }
                },
            ],
            Edges = [new FlowEdgeV1 { Source = "A", Target = "B" }]
        };

        var errs = FlowDagValidation.Validate(def);
        Assert.Contains(errs, e => e.Contains("padre"));
    }
}

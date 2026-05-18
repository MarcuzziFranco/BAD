namespace BAD.Storage.Entities;



public class FlowRunStep

{

    public int Id { get; set; }



    public int FlowRunId { get; set; }



    public FlowRun FlowRun { get; set; } = null!;



    /// <summary>Id estable del nodo en el canvas (coincide con FlowNode en DefinitionJson).</summary>

    public string ClientNodeId { get; set; } = string.Empty;



    public string Status { get; set; } = "pending";



    public int? TestExecutionId { get; set; }



    public TestExecution? TestExecution { get; set; }



    public string? Error { get; set; }



    public DateTime? StartedAt { get; set; }



    public DateTime? FinishedAt { get; set; }

}


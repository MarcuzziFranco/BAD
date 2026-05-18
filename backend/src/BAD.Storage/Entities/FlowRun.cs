namespace BAD.Storage.Entities;



public class FlowRun

{

    public int Id { get; set; }



    public int ExecutionFlowId { get; set; }



    public ExecutionFlow ExecutionFlow { get; set; } = null!;



    public string Status { get; set; } = "pending";



    public int RequestCount { get; set; }



    public string ExecutionMode { get; set; } = "sequential";



    public int IntervalMs { get; set; }



    public bool MutatePerIteration { get; set; } = true;



    public string? Error { get; set; }



    public DateTime StartedAt { get; set; } = DateTime.UtcNow;



    public DateTime? FinishedAt { get; set; }



    public ICollection<FlowRunStep> Steps { get; set; } = new List<FlowRunStep>();

}


namespace BAD.API.DTOs;

public record CreateExecutionFlowDto(
    string Name,
    string? Description,
    string DefinitionJson);

public record UpdateExecutionFlowDto(
    string Name,
    string? Description,
    string DefinitionJson);

public record ExecutionFlowDto(
    int Id,
    string Name,
    string? Description,
    int DefinitionVersion,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record ExecutionFlowDetailDto(
    int Id,
    string Name,
    string? Description,
    int DefinitionVersion,
    string DefinitionJson,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record StartFlowRunDto(
    int RequestCount,
    string? ExecutionMode,
    int? IntervalMs,
    bool? MutatePerIteration);

public record FlowRunDto(
    int Id,
    int ExecutionFlowId,
    string Status,
    int RequestCount,
    string ExecutionMode,
    int IntervalMs,
    bool MutatePerIteration,
    string? Error,
    DateTime StartedAt,
    DateTime? FinishedAt);

public record FlowRunStepDto(
    int Id,
    string ClientNodeId,
    string Status,
    int? TestExecutionId,
    string? Error,
    DateTime? StartedAt,
    DateTime? FinishedAt);

public record FlowRunDetailDto(
    int Id,
    int ExecutionFlowId,
    string FlowName,
    string Status,
    int RequestCount,
    string ExecutionMode,
    int IntervalMs,
    bool MutatePerIteration,
    string? Error,
    DateTime StartedAt,
    DateTime? FinishedAt,
    string DefinitionJson,
    IReadOnlyList<FlowRunStepDto> Steps);

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

public record FlowStepPreviewRequestDto(
    int RequestConfigId,
    string BodyMode,
    string? BaseJson,
    int? TemplateId,
    List<FlowFieldConfigPreviewDto>? Mutations,
    string? PresetName,
    int? DataPresetId,
    bool MutatePerIteration,
    List<FlowInputMappingPreviewDto> InputMappings);

public record FlowFieldConfigPreviewDto(
    string Key,
    string Operation,
    object? Value,
    object? MinValue,
    object? MaxValue,
    List<object>? ListValues);

public record FlowInputMappingPreviewDto(
    string FromNodeId,
    string SourcePath,
    string TargetPath);

public record FlowPreviewMergeRequestDto(
    FlowStepPreviewRequestDto Step,
    Dictionary<string, string>? ParentBodies);

public record FlowPreviewMergeResponseDto(string MergedJson);

public record FlowProbeStepResponseDto(
    string RequestPayload,
    string ResponseBody,
    int StatusCode,
    bool IsSuccess,
    string? Error,
    string MergedJson);

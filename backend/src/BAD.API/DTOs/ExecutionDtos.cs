namespace BAD.API.DTOs;

// DTO legacy para compatibilidad
public record ExecuteTestDto(
    int RequestConfigId,
    int Count,
    string? PresetName,
    bool Sequential
);

// DTO para crear ejecución desde el wizard
public record CreateExecutionDto(
    // Paso 1: Endpoint
    int RequestConfigId,
    
    // Paso 2: JSON Body
    string BodyMode, // none, static, template, template_mutated
    string? BaseJson,
    int? TemplateId,
    List<FieldConfigDto>? Mutations,
    
    // Paso 3: Configuración
    int RequestCount,
    string ExecutionMode, // sequential, parallel, burst
    int IntervalMs,
    bool MutatePerIteration,
    string? PresetName,
    int? DataPresetId = null
);

// DTO para listar ejecuciones
public record TestExecutionDto(
    int Id,
    int RequestConfigId,
    string? RequestConfigName,
    string? PresetUsed,
    string Status,
    string ExecutionMode,
    string BodyMode,
    int TotalRequests,
    int SuccessCount,
    int FailureCount,
    double AvgResponseTimeMs,
    double MinResponseTimeMs,
    double MaxResponseTimeMs,
    DateTime ExecutedAt,
    DateTime? FinishedAt
);

// DTO para detalle de ejecución
public record TestExecutionDetailDto(
    int Id,
    int RequestConfigId,
    string? RequestConfigName,
    string? RequestConfigUrl,
    string? RequestConfigMethod,
    string? PresetUsed,
    string Status,
    string ExecutionMode,
    string BodyMode,
    int? TemplateId,
    string? TemplateName,
    string? BaseJson,
    string? MutationsConfig,
    int IntervalMs,
    bool MutatePerIteration,
    int TotalRequests,
    int SuccessCount,
    int FailureCount,
    double AvgResponseTimeMs,
    double MinResponseTimeMs,
    double MaxResponseTimeMs,
    DateTime ExecutedAt,
    DateTime? FinishedAt
);

// DTO para progreso en tiempo real
public record ExecutionProgressDto(
    int ExecutionId,
    string Status,
    int Completed,
    int Total,
    int Successful,
    int Failed,
    double AvgResponseTimeMs,
    TestResultDto? LastResult
);

// DTO para resultado individual
public record TestResultDto(
    int Id,
    int Index,
    string RequestPayload,
    string? RequestHeaders,
    string? ResponseBody,
    string? ResponseHeaders,
    int StatusCode,
    double DurationMs,
    string? Error,
    bool IsSuccess,
    DateTime ExecutedAt
);

// DTO para resultados paginados
public record PaginatedResultsDto(
    List<TestResultDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

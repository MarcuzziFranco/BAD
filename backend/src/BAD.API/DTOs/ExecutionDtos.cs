namespace BAD.API.DTOs;

public record ExecuteTestDto(
    int RequestConfigId,
    int Count,
    string? PresetName,
    bool Sequential
);

public record TestExecutionDto(
    int Id,
    int RequestConfigId,
    string? PresetUsed,
    int TotalRequests,
    int SuccessCount,
    int FailureCount,
    double AvgResponseTimeMs,
    double MinResponseTimeMs,
    double MaxResponseTimeMs,
    DateTime ExecutedAt
);

public record TestExecutionDetailDto(
    int Id,
    int RequestConfigId,
    string? PresetUsed,
    int TotalRequests,
    int SuccessCount,
    int FailureCount,
    double AvgResponseTimeMs,
    double MinResponseTimeMs,
    double MaxResponseTimeMs,
    DateTime ExecutedAt,
    List<TestResultDto> Results
);

public record TestResultDto(
    int Id,
    int Index,
    string RequestPayload,
    string? ResponseBody,
    int StatusCode,
    double DurationMs,
    string? Error,
    bool IsSuccess
);

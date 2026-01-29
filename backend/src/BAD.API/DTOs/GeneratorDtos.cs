namespace BAD.API.DTOs;

public record GenerateRequestDto(
    string JsonContent,
    int Count,
    string? PresetName
);

public record GenerateResponseDto(
    List<string> GeneratedJsons,
    string? PresetApplied
);

public record AnalyzeRequestDto(string JsonContent);

public record JsonFieldDto(
    string Key,
    string Type,
    object? Value
);

public record AnalyzeResponseDto(List<JsonFieldDto> Fields);

namespace BAD.API.DTOs;

/// <summary>
/// Configuración de un campo para la generación
/// </summary>
public class FieldConfigDto
{
    public string Key { get; set; } = string.Empty;
    public string Operation { get; set; } = "Random"; // Random, Replace, ForceNull, NotChange, RandomRange, RotateList
    public object? Value { get; set; }
    public object? MinValue { get; set; }
    public object? MaxValue { get; set; }
    public List<object>? ListValues { get; set; }
}

public class GenerateRequestDto
{
    public string JsonContent { get; set; } = string.Empty;
    public int Count { get; set; } = 1;
    public string? PresetName { get; set; }
    public List<FieldConfigDto>? FieldConfigs { get; set; }
    public string OutputFormat { get; set; } = "Preview"; // Preview, SingleFile, Database
}

public record GenerateResponseDto(
    List<string> GeneratedJsons,
    string? PresetApplied,
    int? SavedTemplateId
);

public record AnalyzeRequestDto(string JsonContent);

public record JsonFieldDto(
    string Key,
    string Type,
    object? Value
);

public record AnalyzeResponseDto(List<JsonFieldDto> Fields);

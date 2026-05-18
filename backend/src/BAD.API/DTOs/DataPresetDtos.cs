namespace BAD.API.DTOs;

public record DataPresetSummaryDto(
    int Id,
    string Name,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record DataPresetDetailDto(
    int Id,
    string Name,
    string? Description,
    List<FieldConfigDto> FieldConfigurations,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record CreateDataPresetDto(
    string Name,
    string? Description,
    string FieldConfigurationsJson);

public record UpdateDataPresetDto(
    string Name,
    string? Description,
    string FieldConfigurationsJson);

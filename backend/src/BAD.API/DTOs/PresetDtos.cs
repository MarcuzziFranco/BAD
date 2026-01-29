namespace BAD.API.DTOs;

public record PresetDto(
    string Name,
    string Description,
    string Category
);

public record PresetCategoryDto(
    string Category,
    List<PresetDto> Presets
);

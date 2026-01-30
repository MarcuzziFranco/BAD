namespace BAD.API.DTOs;

public record CreateRequestConfigDto(
    string Name,
    string Url,
    string Method,
    string? Headers,
    string? AuthType,
    string? AuthValue,
    int? JsonTemplateId
);

public record UpdateRequestConfigDto(
    string Name,
    string Url,
    string Method,
    string? Headers,
    string? AuthType,
    string? AuthValue,
    int? JsonTemplateId
);

public record RequestConfigDto(
    int Id,
    string Name,
    string Url,
    string Method,
    string? Headers,
    string AuthType,
    string? AuthValue,
    int? JsonTemplateId,
    DateTime CreatedAt
);

// DTOs para cURL
public record ParseCurlRequestDto(string CurlCommand);

public record ParsedCurlDto(
    string Url,
    string Method,
    string? Headers,
    string? Body,
    string? AuthType,
    string? AuthValue,
    List<string> Warnings
);

public record CreateFromCurlRequestDto(
    string CurlCommand,
    string? Name,
    int? JsonTemplateId
);

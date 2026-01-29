namespace BAD.API.DTOs;

public record CreateRequestConfigDto(
    string Name,
    string Url,
    string Method,
    string? Headers,
    string AuthType,
    string? AuthValue,
    int? JsonTemplateId
);

public record UpdateRequestConfigDto(
    string Name,
    string Url,
    string Method,
    string? Headers,
    string AuthType,
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

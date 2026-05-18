using Microsoft.OpenApi.Models;

namespace BAD.Core.OpenApi;

public static class OpenApiOperationEnumerator
{
    private static readonly string[] HttpMethods =
        ["get", "post", "put", "patch", "delete", "head", "options"];

    public static OpenApiAnalyzeResult Analyze(OpenApiDocument document, string? baseUrl)
    {
        var result = new OpenApiAnalyzeResult
        {
            OpenApiVersion = OpenApiDocumentLoader.GetOpenApiVersion(document),
            InfoTitle = document.Info?.Title ?? "API",
            InfoVersion = document.Info?.Version ?? "1.0",
            SuggestedBaseUrl = OpenApiDocumentLoader.GetSuggestedBaseUrl(document)
        };

        if (document.Paths == null)
            return result;

        foreach (var pathItem in document.Paths)
        {
            var path = pathItem.Key;
            var item = pathItem.Value;
            if (item?.Operations == null)
                continue;

            foreach (var opKv in item.Operations)
            {
                var method = opKv.Key.ToString().ToUpperInvariant();
                if (!HttpMethods.Contains(method.ToLowerInvariant()))
                    continue;

                var operation = opKv.Value;
                var operationKey = BuildOperationKey(method, path);
                var tag = operation.Tags?.FirstOrDefault()?.Name ?? "Default";
                var (hasBody, schemaRef, schema) = ResolveRequestBody(operation, document);

                if (hasBody && schemaRef != null && OpenApiSchemaSampler.IsIgnoredSchemaName(schemaRef))
                    hasBody = false;

                string? sampleJson = null;
                if (hasBody && schema != null)
                {
                    try
                    {
                        sampleJson = OpenApiSchemaSampler.SampleToJson(schema, document);
                    }
                    catch
                    {
                        sampleJson = "{}";
                    }
                }

                var schemaLabel = schemaRef ?? "body";
                result.Operations.Add(new OpenApiOperationPreview
                {
                    OperationKey = operationKey,
                    Path = path,
                    Method = method,
                    Tag = tag,
                    Summary = operation.Summary ?? operation.OperationId,
                    HasRequestBody = hasBody,
                    RequestSchemaRef = schemaRef,
                    SampleJson = sampleJson,
                    SuggestedTemplateName = $"{tag} - {schemaLabel}",
                    SuggestedServiceName = $"{method} {TrimPathForName(path)}",
                    ImportStatus = "pending"
                });
            }
        }

        return result;
    }

    public static string BuildOperationKey(string method, string path) =>
        $"{method.ToUpperInvariant()} {NormalizePath(path)}";

    public static string NormalizePath(string path)
    {
        if (string.IsNullOrEmpty(path))
            return "/";
        return path.StartsWith('/') ? path : "/" + path;
    }

    public static string CombineUrl(string baseUrl, string path)
    {
        baseUrl = (baseUrl ?? "").TrimEnd('/');
        path = NormalizePath(path);
        if (string.IsNullOrEmpty(baseUrl))
            return path;
        return baseUrl + path;
    }

    private static string TrimPathForName(string path)
    {
        var p = path.Trim('/');
        if (p.Length > 40)
            return p[..37] + "...";
        return p;
    }

    private static (bool hasBody, string? schemaRef, OpenApiSchema? schema) ResolveRequestBody(
        OpenApiOperation operation,
        OpenApiDocument document)
    {
        if (operation.RequestBody?.Content == null || operation.RequestBody.Content.Count == 0)
            return (false, null, null);

        var media = operation.RequestBody.Content
            .FirstOrDefault(c => c.Key.Equals("application/json", StringComparison.OrdinalIgnoreCase));
        if (media.Key == null)
        {
            media = operation.RequestBody.Content
                .FirstOrDefault(c => c.Key.Contains("json", StringComparison.OrdinalIgnoreCase));
        }
        if (media.Key == null && operation.RequestBody.Content.Count == 1)
            media = operation.RequestBody.Content.First();

        if (media.Key == null)
            return (false, null, null);

        var schema = media.Value?.Schema;
        if (schema == null)
            return (true, "body", null);

        var resolved = ResolveSchema(schema, document, out var refName);
        return (true, refName ?? "body", resolved ?? schema);
    }

    private static OpenApiSchema? ResolveSchema(OpenApiSchema schema, OpenApiDocument document, out string? refName)
    {
        refName = ResolveSchemaRefName(schema);
        if (refName != null &&
            document.Components?.Schemas != null &&
            document.Components.Schemas.TryGetValue(refName, out var fromComponents))
        {
            return fromComponents;
        }

        if (schema.AllOf?.Count > 0)
        {
            refName ??= ResolveSchemaRefName(schema.AllOf[0]);
            return schema.AllOf[0];
        }

        if (schema.OneOf?.Count > 0)
        {
            refName ??= ResolveSchemaRefName(schema.OneOf[0]);
            return schema.OneOf[0];
        }

        if (schema.AnyOf?.Count > 0)
        {
            refName ??= ResolveSchemaRefName(schema.AnyOf[0]);
            return schema.AnyOf[0];
        }

        return schema;
    }

    private static string? ResolveSchemaRefName(OpenApiSchema schema)
    {
        if (!string.IsNullOrEmpty(schema.Reference?.Id))
            return schema.Reference.Id;
        var v3 = schema.Reference?.ReferenceV3;
        if (string.IsNullOrEmpty(v3))
            return null;
        var segment = v3.TrimEnd('/').Split('/').LastOrDefault();
        return string.IsNullOrEmpty(segment) ? null : segment;
    }
}

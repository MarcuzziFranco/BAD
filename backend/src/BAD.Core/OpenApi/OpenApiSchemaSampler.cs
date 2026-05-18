using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BAD.Core.OpenApi;

public static class OpenApiSchemaSampler
{
    private static readonly HashSet<string> IgnoredSchemaNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "ProblemDetails",
        "ValidationProblemDetails"
    };

    public static bool IsIgnoredSchemaName(string? refName) =>
        refName != null && IgnoredSchemaNames.Contains(refName);

    public static string SampleToJson(OpenApiSchema? schema, OpenApiDocument document, int maxDepth = 8)
    {
        var token = SampleToken(schema, document, maxDepth, new HashSet<string>(StringComparer.Ordinal));
        return token?.ToString(Formatting.Indented) ?? "{}";
    }

    private static JToken? SampleToken(
        OpenApiSchema? schema,
        OpenApiDocument document,
        int depth,
        HashSet<string> refStack)
    {
        if (schema == null || depth <= 0)
            return JValue.CreateNull();

        var hasInlineProperties = schema.Properties != null && schema.Properties.Count > 0;
        if (schema.Reference != null && !hasInlineProperties)
        {
            var refId = schema.Reference.Id;
            if (string.IsNullOrEmpty(refId) && !string.IsNullOrEmpty(schema.Reference.ReferenceV3))
                refId = schema.Reference.ReferenceV3.TrimEnd('/').Split('/').LastOrDefault();
            if (string.IsNullOrEmpty(refId) || refStack.Contains(refId))
                return new JObject();
            refStack.Add(refId);
            if (document.Components?.Schemas != null &&
                document.Components.Schemas.TryGetValue(refId, out var resolved))
            {
                var t = SampleToken(resolved, document, depth - 1, refStack);
                refStack.Remove(refId);
                return t;
            }
            refStack.Remove(refId);
            return new JObject();
        }

        if (schema.AllOf?.Count > 0)
        {
            var merged = new JObject();
            foreach (var part in schema.AllOf)
            {
                var partToken = SampleToken(part, document, depth - 1, refStack);
                if (partToken is JObject partObj)
                {
                    foreach (var prop in partObj.Properties())
                        merged[prop.Name] = prop.Value?.DeepClone();
                }
            }
            return merged;
        }

        if (schema.OneOf?.Count > 0)
            return SampleToken(schema.OneOf[0], document, depth - 1, refStack);

        if (schema.AnyOf?.Count > 0)
            return SampleToken(schema.AnyOf[0], document, depth - 1, refStack);

        if (schema.Enum?.Count > 0)
            return JToken.FromObject(schema.Enum[0]);

        var type = schema.Type?.ToLowerInvariant();
        var format = schema.Format?.ToLowerInvariant();

        if (type == "array" || schema.Items != null)
        {
            var item = SampleToken(schema.Items, document, depth - 1, refStack);
            return new JArray { item ?? JValue.CreateNull() };
        }

        if (type == "object" || schema.Properties?.Count > 0)
        {
            var obj = new JObject();
            var required = schema.Required != null
                ? new HashSet<string>(schema.Required, StringComparer.Ordinal)
                : new HashSet<string>(StringComparer.Ordinal);

            foreach (var kv in schema.Properties ?? new Dictionary<string, OpenApiSchema>())
            {
                var include = required.Contains(kv.Key) || schema.Nullable != false;
                if (!include && !required.Contains(kv.Key))
                {
                    obj[kv.Key] = JValue.CreateNull();
                    continue;
                }
                obj[kv.Key] = SampleToken(kv.Value, document, depth - 1, refStack) ?? JValue.CreateNull();
            }

            if (schema.AdditionalProperties != null && schema.AdditionalProperties is OpenApiSchema ap)
                obj["additionalProp"] = SampleToken(ap, document, depth - 1, refStack) ?? JValue.CreateNull();

            return obj;
        }

        if (type == "integer")
            return new JValue(format == "int64" ? 1L : 1);

        if (type == "number")
            return new JValue(1.0);

        if (type == "boolean")
            return new JValue(true);

        if (type == "string")
        {
            return format switch
            {
                "uuid" => new JValue("00000000-0000-0000-0000-000000000001"),
                "email" => new JValue("user@example.com"),
                "date-time" => new JValue(DateTime.UtcNow.ToString("o")),
                "date" => new JValue(DateTime.UtcNow.ToString("yyyy-MM-dd")),
                "uri" => new JValue("https://example.com"),
                "tel" => new JValue("+5491112345678"),
                "credit-card" => new JValue("4111111111111111"),
                _ => new JValue(SampleString(schema))
            };
        }

        if (schema.Default != null)
            return JToken.FromObject(schema.Default);

        if (string.IsNullOrEmpty(type))
            return new JValue(SampleString(schema));

        return JValue.CreateNull();
    }

    private static string SampleString(OpenApiSchema schema)
    {
        if (schema.MinLength.HasValue && schema.MinLength > 0)
            return new string('x', Math.Min(schema.MinLength.Value, 20));
        if (schema.MaxLength.HasValue && schema.MaxLength < 5)
            return new string('x', schema.MaxLength.Value);
        return "sample";
    }
}

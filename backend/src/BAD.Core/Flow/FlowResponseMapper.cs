using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Flow;

public static class FlowResponseMapper
{
    /// <summary>
    /// Parte del <paramref name="nodeBaseTemplate" /> (JSON) y aplica asignaciones desde las respuestas de padres para el índice actual.
    /// </summary>
    public static JObject BuildMergedBase(
        string? nodeBaseTemplate,
        IReadOnlyDictionary<string, JObject?> parentBodies,
        IReadOnlyList<FlowInputMappingV1> mappings)
    {
        var target = string.IsNullOrWhiteSpace(nodeBaseTemplate)
            ? new JObject()
            : ParseObjectOrEmpty(nodeBaseTemplate);

        foreach (var m in mappings)
        {
            if (!parentBodies.TryGetValue(m.FromNodeId, out var parent) || parent is null)
                continue;

            var path = NormalizeJsonPath(m.SourcePath);
            var token = string.IsNullOrEmpty(path) ? parent.Root : parent.SelectToken(path);
            if (token is null || token.Type == JTokenType.Undefined)
                continue;

            SetAtTargetPath(target, m.TargetPath, token.DeepClone());
        }

        return target;
    }

    public static string NormalizeJsonPath(string path)
    {
        path = path.Trim();
        if (path.StartsWith("$.", StringComparison.Ordinal))
            path = path[2..];
        else if (path.StartsWith('$'))
            path = path[1..].TrimStart('.');
        return path;
    }

    internal static JObject ParseObjectOrEmpty(string json)
    {
        try
        {
            var t = JToken.Parse(json);
            return t switch
            {
                JObject o => (JObject)o.DeepClone(),
                _ => new JObject { ["value"] = t.DeepClone() }
            };
        }
        catch
        {
            return new JObject();
        }
    }

    /// <summary>Parsea respuesta HTTP como objeto JSON; si no es JSON devuelve objeto vacío.</summary>
    public static JObject? ParseResponseBody(string? responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return new JObject();
        try
        {
            var t = JToken.Parse(responseBody);
            return t as JObject ?? new JObject { ["value"] = t };
        }
        catch
        {
            return new JObject();
        }
    }

    private static void SetAtTargetPath(JObject root, string targetPath, JToken value)
    {
        var path = NormalizeJsonPath(targetPath);
        if (string.IsNullOrEmpty(path))
        {
            if (value is JObject vo)
            {
                root.Merge(vo, new JsonMergeSettings { MergeArrayHandling = MergeArrayHandling.Union });
            }
            return;
        }

        var segments = ParseTargetSegments(path);
        if (segments.Count == 0)
            return;

        JToken current = root;
        for (var i = 0; i < segments.Count; i++)
        {
            var seg = segments[i];
            var isLast = i == segments.Count - 1;

            if (seg.IsArrayIndex)
            {
                if (current is not JArray arr)
                    throw new FlowDefinitionException($"Ruta destino inválida en segmento índice: {targetPath}");

                while (arr.Count <= seg.Index)
                    arr.Add(JValue.CreateNull());

                if (isLast)
                {
                    arr[seg.Index] = value;
                    return;
                }

                if (arr[seg.Index] is not JObject && arr[seg.Index].Type != JTokenType.Null)
                    arr[seg.Index] = new JObject();
                if (arr[seg.Index].Type == JTokenType.Null || arr[seg.Index] is not JObject)
                    arr[seg.Index] = new JObject();

                current = arr[seg.Index]!;
            }
            else
            {
                var name = seg.Name!;
                if (current is not JObject jobj)
                    throw new FlowDefinitionException($"Ruta destino inválida: {targetPath}");

                if (isLast)
                {
                    jobj[name] = value;
                    return;
                }

                var childTok = jobj[name];
                if (childTok is not JObject || childTok.Type == JTokenType.Null)
                {
                    jobj[name] = new JObject();
                    current = jobj[name]!;
                }
                else
                    current = childTok;
            }
        }
    }

    private static List<PathSegment> ParseTargetSegments(string path)
    {
        // dotted path with optional prop[n] segments: a.b[0].c
        var list = new List<PathSegment>();
        foreach (var raw in path.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var m = Regex.Match(raw, @"^(\w+)\[(\d+)\]$");
            if (m.Success)
            {
                list.Add(new PathSegment { Name = m.Groups[1].Value });
                list.Add(new PathSegment { IsArrayIndex = true, Index = int.Parse(m.Groups[2].Value) });
            }
            else
                list.Add(new PathSegment { Name = raw });
        }

        return list;
    }

    private sealed class PathSegment
    {
        public string? Name { get; init; }
        public bool IsArrayIndex { get; init; }
        public int Index { get; init; }
    }
}

using Newtonsoft.Json;

namespace BAD.Core.Flow;

/// <summary>Documento de definición serializado en ExecutionFlow.DefinitionJson (v1).</summary>
public class FlowDefinitionV1
{
    [JsonProperty("version")]
    public int Version { get; set; } = 1;

    [JsonProperty("nodes")]
    public List<FlowNodeV1> Nodes { get; set; } = new();

    [JsonProperty("edges")]
    public List<FlowEdgeV1> Edges { get; set; } = new();
}

public class FlowNodeV1
{
    [JsonProperty("id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("position")]
    public FlowNodePositionV1? Position { get; set; }

    [JsonProperty("label")]
    public string? Label { get; set; }

    [JsonProperty("step")]
    public FlowStepV1 Step { get; set; } = new();
}

public class FlowNodePositionV1
{
    [JsonProperty("x")]
    public double X { get; set; }

    [JsonProperty("y")]
    public double Y { get; set; }
}

public class FlowEdgeV1
{
    [JsonProperty("id")]
    public string? Id { get; set; }

    [JsonProperty("source")]
    public string Source { get; set; } = string.Empty;

    [JsonProperty("target")]
    public string Target { get; set; } = string.Empty;
}

public class FlowStepV1
{
    [JsonProperty("requestConfigId")]
    public int RequestConfigId { get; set; }

    [JsonProperty("bodyMode")]
    public string BodyMode { get; set; } = "none";

    [JsonProperty("baseJson")]
    public string? BaseJson { get; set; }

    [JsonProperty("templateId")]
    public int? TemplateId { get; set; }

    [JsonProperty("mutations")]
    public List<FlowFieldConfigV1>? Mutations { get; set; }

    [JsonProperty("presetName")]
    public string? PresetName { get; set; }

    [JsonProperty("dataPresetId")]
    public int? DataPresetId { get; set; }

    [JsonProperty("mutatePerIteration")]
    public bool MutatePerIteration { get; set; } = true;

    [JsonProperty("inputMappings")]
    public List<FlowInputMappingV1> InputMappings { get; set; } = new();
}

public class FlowFieldConfigV1
{
    [JsonProperty("key")]
    public string Key { get; set; } = string.Empty;

    [JsonProperty("operation")]
    public string Operation { get; set; } = "Random";

    [JsonProperty("value")]
    public object? Value { get; set; }

    [JsonProperty("minValue")]
    public object? MinValue { get; set; }

    [JsonProperty("maxValue")]
    public object? MaxValue { get; set; }

    [JsonProperty("listValues")]
    public List<object>? ListValues { get; set; }
}

public class FlowInputMappingV1
{
    /// <summary>Id del nodo padre (client node id).</summary>
    [JsonProperty("fromNodeId")]
    public string FromNodeId { get; set; } = string.Empty;

    /// <summary>Ruta JSON en la respuesta del padre (compatible con SelectToken).</summary>
    [JsonProperty("sourcePath")]
    public string SourcePath { get; set; } = string.Empty;

    /// <summary>Ruta destino en el JSON base del nodo.</summary>
    [JsonProperty("targetPath")]
    public string TargetPath { get; set; } = string.Empty;
}

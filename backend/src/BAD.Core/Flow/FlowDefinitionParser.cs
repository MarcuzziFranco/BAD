using Newtonsoft.Json;

namespace BAD.Core.Flow;

public static class FlowDefinitionParser
{
    public static FlowDefinitionV1 Parse(string json)
    {
        var def = JsonConvert.DeserializeObject<FlowDefinitionV1>(json)
            ?? throw new FlowDefinitionException("Definición vacía o inválida.");
        if (def.Version == 0)
            def.Version = 1;
        if (def.Version != 1)
            throw new FlowDefinitionException($"Versión de definición no soportada: {def.Version}.");
        return def;
    }
}

public class FlowDefinitionException : Exception
{
    public FlowDefinitionException(string message) : base(message) { }
}

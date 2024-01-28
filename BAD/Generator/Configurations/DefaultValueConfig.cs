using Newtonsoft.Json.Linq;

namespace BAD.Generator.Configurations;

public class DefaultValueConfig
{
    public JTokenType? TypeDefault { get; set; }
    public dynamic? Value { get; set; }
}

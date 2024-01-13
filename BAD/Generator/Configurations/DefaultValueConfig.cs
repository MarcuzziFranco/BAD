using Newtonsoft.Json.Linq;

namespace BAD.Generator.Configurations;

public class DefaultValueConfig
{
    public JTokenType? Type { get; set; }
    public dynamic? Value { get; set; }

    public EnumOperations Operation;
}

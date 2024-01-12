namespace BAD.Services.FilteringPattern;

public static class FieldOperatorExtensions
{
    public static string GetShortName(this FieldOperator FieldOperator) => FieldOperator switch
    {
        FieldOperator.GreaterThan => "gt",
        FieldOperator.GreaterThanOrEqual => "gte",
        FieldOperator.LessThan => "lt",
        FieldOperator.LessThanOrEqual => "lte",
        FieldOperator.Equal => "",
        FieldOperator.NotEqual => "ne",
        FieldOperator.In => "in",
        FieldOperator.NotIn => "ni",
        FieldOperator.StringContains => "strc",
        FieldOperator.StringStartsWith => "strsw",
        FieldOperator.StringEndsWith => "strew",
        _ => "",
    };

    public static string GetExplicitShortName(this FieldOperator FieldOperator) => FieldOperator switch
    {
        FieldOperator.Equal => "eq",
        _ => FieldOperator.GetShortName(),
    };
}

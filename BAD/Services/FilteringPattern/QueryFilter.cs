namespace BAD.Services.FilteringPattern;

public class QueryFilter<T>
{
    public FieldOperator Operator { get; set; }
    public T Value { get; set; }
    public string? Name { get; set; }
}

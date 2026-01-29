namespace BAD.Services.FilteringPattern;

public class QueryFilter<T>
{
    public FieldOperator Operator { get; set; }
    public T Value { get; set; } = default!;
    public string? Name { get; set; }
}

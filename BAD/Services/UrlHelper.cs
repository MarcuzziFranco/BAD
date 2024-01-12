
using BAD.Services.FilteringPattern;
using System.Reflection;
using System.Web;

namespace BAD.Services;

public static class UrlHelper
{
    public static string ToQueryString(this object obj)
    {
#pragma warning disable CS8602 // Desreferencia de una referencia posiblemente NULL.
        var properties = from p in obj.GetType().GetProperties()
                         where p.GetValue(obj, null) != null
                         select $"{StringValue(obj, p)}";
#pragma warning restore CS8602 // Desreferencia de una referencia posiblemente NULL.

        return string.Join("&", properties.ToArray());
    }

    private static bool IsQueryFilter(Type propertyType, out Type? attributeType)
    {
        attributeType = null;
        if (propertyType == null || !propertyType.IsGenericType)
        {
            return false;
        }

        var genericType = propertyType.GetGenericTypeDefinition();
        if (genericType != typeof(QueryFilter<>))
        {
            return false;
        }

        attributeType = propertyType.GetGenericArguments()[0];
        return true;
    }

    private static string ConcatSnakeCase(string value1, string value2) => value1 + (value2.Equals("") ? "" : "_" + value2);

    private static FieldOperator GetFieldOperator(object value)
    {
        object? fieldOperator = value.GetType().GetProperty("Operator")?.GetValue(value);
        return fieldOperator is null ? FieldOperator.Equal : (FieldOperator)fieldOperator;
    }

    private static object? GetFieldValue(object value)
    {
        return value.GetType().GetProperty("Value")?.GetValue(value);
    }

    private static string? GetFieldName(object value)
    {
        return value.GetType().GetProperty("Name")?.GetValue(value)?.ToString();
    }

    private static string StringValue(object obj, PropertyInfo propertyInfo)
    {
        object? valueOfProp = propertyInfo.GetValue(obj);

        if (valueOfProp == null)
        {
            return string.Empty;
        }

        var name = propertyInfo.Name.PascalToKebabCase();
        var value = string.Empty;

        Type propertyType = propertyInfo.PropertyType;

        #region QueryFilter boostrap
        if (IsQueryFilter(propertyType, out var attributeType))
        {
            if (attributeType != null)
            {
                object? queryFilter = valueOfProp;
                propertyType = attributeType;
                valueOfProp = GetFieldValue(queryFilter);

                #region QueryFilter override prop name
                string? declaredName = GetFieldName(queryFilter);
                if (!string.IsNullOrEmpty(declaredName))
                {
                    name = declaredName.PascalToKebabCase();
                }
                #endregion

                name = ConcatSnakeCase(name, GetFieldOperator(queryFilter).GetShortName());
            }
        }
        #endregion QueryFilter boostrap

        if (propertyType.FullName?.Equals(typeof(string).FullName!) ?? false)
        {
            value = BuildQueryValue(name, valueOfProp?.ToString() ?? string.Empty);
        }
        else if (propertyType.GetInterface(typeof(System.Collections.IEnumerable).FullName!) != null)
        {
            foreach (var item in (System.Collections.IEnumerable)valueOfProp!)
            {
                value += BuildQueryValue(name, item?.ToString() ?? string.Empty) + "&";
            }
            value = value.TrimEnd('&');
        }
        else
        {
            value = BuildQueryValue(name, valueOfProp?.ToString() ?? string.Empty);
        }
        return value;
    }

    private static string BuildQueryValue(string key, string value) => $"{key}={HttpUtility.UrlEncode(value)}";

    public static string PascalToKebabCase(this string str) => string.Join('-', System.Text.RegularExpressions.Regex.Split(str, @"(?<!^)(?=[A-Z])")).ToLower();
}

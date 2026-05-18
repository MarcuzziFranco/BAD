namespace BAD.Core.Flow;

public static class FlowDagValidation
{
    public static IReadOnlyList<string> TopologicalOrder(FlowDefinitionV1 def)
    {
        var errors = Validate(def);
        if (errors.Count > 0)
            throw new FlowDefinitionException(string.Join("; ", errors));

        var nodeIds = def.Nodes.Select(n => n.Id).ToHashSet(StringComparer.Ordinal);
        var adj = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        var indegree = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var id in nodeIds)
        {
            adj[id] = new List<string>();
            indegree[id] = 0;
        }

        foreach (var e in def.Edges)
        {
            if (!nodeIds.Contains(e.Source) || !nodeIds.Contains(e.Target))
                continue;
            adj[e.Source].Add(e.Target);
            indegree[e.Target]++;
        }

        var q = new Queue<string>(indegree.Where(kv => kv.Value == 0).Select(kv => kv.Key));
        var order = new List<string>();
        while (q.Count > 0)
        {
            var u = q.Dequeue();
            order.Add(u);
            foreach (var v in adj[u])
            {
                indegree[v]--;
                if (indegree[v] == 0)
                    q.Enqueue(v);
            }
        }

        if (order.Count != nodeIds.Count)
            throw new FlowDefinitionException("El grafo contiene un ciclo.");

        return order;
    }

    public static IReadOnlyList<string> Validate(FlowDefinitionV1 def)
    {
        var errors = new List<string>();
        if (def.Nodes.Count == 0)
            errors.Add("Se requiere al menos un nodo.");

        var nodeIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var n in def.Nodes)
        {
            if (string.IsNullOrWhiteSpace(n.Id))
                errors.Add("Cada nodo debe tener id.");
            else if (!nodeIds.Add(n.Id))
                errors.Add($"Id de nodo duplicado: {n.Id}");
            if (n.Step.RequestConfigId <= 0)
                errors.Add($"Nodo {n.Id}: requestConfigId inválido.");
        }

        var idSet = nodeIds.ToHashSet(StringComparer.Ordinal);
        foreach (var e in def.Edges)
        {
            if (string.IsNullOrWhiteSpace(e.Source) || string.IsNullOrWhiteSpace(e.Target))
            {
                errors.Add("Cada arista requiere source y target.");
                continue;
            }

            if (!idSet.Contains(e.Source))
                errors.Add($"Arista referencia source inexistente: {e.Source}.");
            if (!idSet.Contains(e.Target))
                errors.Add($"Arista referencia target inexistente: {e.Target}.");
        }

        var parents = BuildParents(def);
        foreach (var n in def.Nodes)
        {
            foreach (var m in n.Step.InputMappings)
            {
                if (string.IsNullOrWhiteSpace(m.FromNodeId))
                {
                    errors.Add($"Nodo {n.Id}: mapping sin fromNodeId.");
                    continue;
                }

                if (!parents.TryGetValue(n.Id, out var ps) || !ps.Contains(m.FromNodeId))
                    errors.Add($"Nodo {n.Id}: mapping desde '{m.FromNodeId}' debe ser un padre directo en el DAG.");
            }
        }

        return errors;
    }

    public static Dictionary<string, HashSet<string>> BuildParents(FlowDefinitionV1 def)
    {
        var parents = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
        foreach (var n in def.Nodes)
            parents[n.Id] = new HashSet<string>(StringComparer.Ordinal);
        foreach (var e in def.Edges)
        {
            if (parents.TryGetValue(e.Target, out var set))
                set.Add(e.Source);
        }
        return parents;
    }

    public static Dictionary<string, HashSet<string>> BuildChildren(FlowDefinitionV1 def)
    {
        var children = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
        foreach (var n in def.Nodes)
            children[n.Id] = new HashSet<string>(StringComparer.Ordinal);
        foreach (var e in def.Edges)
        {
            if (children.TryGetValue(e.Source, out var set))
                set.Add(e.Target);
        }
        return children;
    }

    public static HashSet<string> RootNodes(FlowDefinitionV1 def)
    {
        var parents = BuildParents(def);
        return def.Nodes.Where(n => parents[n.Id].Count == 0).Select(n => n.Id).ToHashSet(StringComparer.Ordinal);
    }
}

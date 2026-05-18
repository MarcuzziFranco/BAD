using BAD.Storage.Entities;
using Microsoft.EntityFrameworkCore;

namespace BAD.Storage.Context;

public class BadDbContext : DbContext
{
    public BadDbContext(DbContextOptions<BadDbContext> options) : base(options)
    {
    }

    public DbSet<JsonTemplate> JsonTemplates => Set<JsonTemplate>();
    public DbSet<RequestConfig> RequestConfigs => Set<RequestConfig>();
    public DbSet<TestExecution> TestExecutions => Set<TestExecution>();
    public DbSet<TestResult> TestResults => Set<TestResult>();
    public DbSet<GeneratorSetting> GeneratorSettings => Set<GeneratorSetting>();
    public DbSet<ExecutionFlow> ExecutionFlows => Set<ExecutionFlow>();
    public DbSet<FlowRun> FlowRuns => Set<FlowRun>();
    public DbSet<FlowRunStep> FlowRunSteps => Set<FlowRunStep>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // JsonTemplate
        modelBuilder.Entity<JsonTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Content).IsRequired();
            entity.HasIndex(e => e.Name);
        });

        // RequestConfig
        modelBuilder.Entity<RequestConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Url).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.Method).IsRequired().HasMaxLength(10);
            entity.Property(e => e.AuthType).HasMaxLength(20);

            entity.HasOne(e => e.JsonTemplate)
                .WithMany(t => t.RequestConfigs)
                .HasForeignKey(e => e.JsonTemplateId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // TestExecution
        modelBuilder.Entity<TestExecution>(entity =>
        {
            entity.HasKey(e => e.Id);        
        entity.Property(e => e.PresetUsed).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("pending");
            entity.Property(e => e.ExecutionMode).HasMaxLength(20).HasDefaultValue("sequential");
            entity.Property(e => e.BodyMode).HasMaxLength(30).HasDefaultValue("none");
            entity.HasIndex(e => e.ExecutedAt);
            entity.HasIndex(e => e.Status);

            entity.HasOne(e => e.RequestConfig)
                .WithMany(c => c.TestExecutions)
                .HasForeignKey(e => e.RequestConfigId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Template)
                .WithMany()
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // TestResult
        modelBuilder.Entity<TestResult>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ExecutedAt);

            entity.HasOne(e => e.TestExecution)
                .WithMany(x => x.Results)
                .HasForeignKey(e => e.TestExecutionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // GeneratorSetting
        modelBuilder.Entity<GeneratorSetting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasIndex(e => new { e.JsonTemplateId, e.Name }).IsUnique();

            entity.HasOne(e => e.JsonTemplate)
                .WithMany(t => t.GeneratorSettings)
                .HasForeignKey(e => e.JsonTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExecutionFlow>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DefinitionJson).IsRequired();
            entity.HasIndex(e => e.Name);
        });

        modelBuilder.Entity<FlowRun>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ExecutionMode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Error).HasMaxLength(4000);
            entity.HasIndex(e => e.StartedAt);

            entity.HasOne(e => e.ExecutionFlow)
                .WithMany(f => f.FlowRuns)
                .HasForeignKey(e => e.ExecutionFlowId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FlowRunStep>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ClientNodeId).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Error).HasMaxLength(4000);

            entity.HasIndex(e => new { e.FlowRunId, e.ClientNodeId });

            entity.HasOne(e => e.FlowRun)
                .WithMany(r => r.Steps)
                .HasForeignKey(e => e.FlowRunId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.TestExecution)
                .WithMany()
                .HasForeignKey(e => e.TestExecutionId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}

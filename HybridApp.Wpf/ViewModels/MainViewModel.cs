using System.Diagnostics;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using HybridApp.Core.Services;

namespace HybridApp.Wpf.ViewModels;

/// <summary>
/// VIEWMODEL LAYER: Coordinates the data generation and the UI state.
/// </summary>
public partial class MainViewModel : ObservableObject
{
    private readonly IDataService _dataService;

    [ObservableProperty]
    private string _title = "Hybrid High-Performance App";

    [ObservableProperty]
    private string _statusMessage = "Ready";

    [ObservableProperty]
    private int _dataPointCount = 2000000; // Default to 2M for testing performance

    private byte[]? _latestBuffer;
    public byte[]? LatestBuffer => _latestBuffer;

    // Event used to signal the View (MainWindow) that new data is ready for the bridge
    public event Action? DataGenerated;

    public MainViewModel(IDataService dataService)
    {
        _dataService = dataService;
    }

    [RelayCommand]
    private void GenerateData()
    {
        StatusMessage = $"Generating {DataPointCount:N0} points...";
        
        Stopwatch sw = Stopwatch.StartNew();
        
        // Call the service to generate binary FlatBuffer data
        _latestBuffer = _dataService.GenerateFlatBuffer(DataPointCount);
        
        sw.Stop();

        StatusMessage = $"Generated {DataPointCount:N0} points in {sw.ElapsedMilliseconds}ms ({_latestBuffer.Length / 1024 / 1024.0:F2} MB)";
        
        // Notify the bridge
        DataGenerated?.Invoke();
    }
}

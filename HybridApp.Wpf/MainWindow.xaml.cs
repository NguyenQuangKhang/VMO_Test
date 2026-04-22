using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows;
using HybridApp.Wpf.ViewModels;
using Microsoft.Web.WebView2.Core;

namespace HybridApp.Wpf;

/// <summary>
/// BRIDGE LAYER: Manages the Shared Memory connection to the Browser.
/// </summary>
public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;
    private CoreWebView2SharedBuffer? _lastBuffer;

    public MainWindow(MainViewModel viewModel)
    {
        _viewModel = viewModel;
        InitializeComponent();
        DataContext = viewModel;
        
        // Listen for data generation in the ViewModel
        _viewModel.DataGenerated += OnDataGenerated;
        
        InitializeWebView();
    }

    private async void InitializeWebView()
    {
        try
        {
            string userDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HybridApp_New");
            var environment = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            
            await webView.EnsureCoreWebView2Async(environment);

            // Virtual Hosting: Map localhost to our Angular build folder
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string wwwRoot = Path.GetFullPath(Path.Combine(baseDir, @"..\..\..\..\HybridApp.Web\dist\HybridApp.Web"));
            
            if (Directory.Exists(wwwRoot))
            {
                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "localhost", 
                    wwwRoot, 
                    CoreWebView2HostResourceAccessKind.Allow);
                
                webView.CoreWebView2.Navigate("http://localhost/index.html");
            }
            else
            {
                MessageBox.Show($"Web Assets Folder Not Found at: {wwwRoot}");
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"WebView2 Error: {ex.Message}");
        }
    }

    private void OnDataGenerated()
    {
        if (webView.CoreWebView2 != null && _viewModel.LatestBuffer != null)
        {
            try
            {
                byte[] data = _viewModel.LatestBuffer;
                
                // DISPOSE old buffer to free RAM
                _lastBuffer?.Dispose();

                // CREATE new Shared Memory block
                _lastBuffer = webView.CoreWebView2.Environment.CreateSharedBuffer((ulong)data.Length);
                
                // COPY binary data directly into Shared RAM
                Marshal.Copy(data, 0, _lastBuffer.Buffer, data.Length);

                // SIGNAL the Web App to read the buffer
                webView.CoreWebView2.PostSharedBufferToScript(
                    _lastBuffer, 
                    CoreWebView2SharedBufferAccess.ReadOnly, 
                    "{\"type\": \"DATA_SHARED_BUFFER\"}");
            }
            catch (Exception ex)
            {
                _viewModel.StatusMessage = $"Bridge Error: {ex.Message}";
            }
        }
    }

    protected override void OnClosed(EventArgs e)
    {
        _lastBuffer?.Dispose();
        base.OnClosed(e);
    }
}

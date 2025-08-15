/**
 * OnPrem Viewer Settings Page - Data Source Configuration
 */
"use client";

import { useState, useEffect } from "react";

interface DataSourceConfig {
  id: string;
  type: "sql" | "xml" | "csv" | "api";
  name: string;
  connectionString?: string;
  filePath?: string;
  apiEndpoint?: string;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
  queryTemplate?: string;
  tableName?: string; // Add table name for SQL queries
  lastSync?: string;
  status: "connected" | "disconnected" | "error";
}

interface ManifestConfig {
  controlPlaneUrl: string;
  licenseKey: string;
  syncInterval: number; // minutes
  lastSync: string;
  version: string;
}

export default function SettingsPage() {
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([]);
  const [manifestConfig, setManifestConfig] = useState<ManifestConfig>({
    controlPlaneUrl: "https://your-control-plane.com",
    licenseKey: "",
    syncInterval: 15,
    lastSync: "",
    version: "1.0.0",
  });
  const [activeTab, setActiveTab] = useState<
    "datasources" | "manifest" | "system"
  >("datasources");
  const [newDataSource, setNewDataSource] = useState<Partial<DataSourceConfig>>(
    {
      type: "sql",
      name: "",
      status: "disconnected",
    }
  );
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load data sources from local storage or config file
      const savedDataSources = localStorage.getItem("onprem-datasources");
      if (savedDataSources) {
        setDataSources(JSON.parse(savedDataSources));
      }

      const savedManifest = localStorage.getItem("onprem-manifest-config");
      if (savedManifest) {
        setManifestConfig(JSON.parse(savedManifest));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const saveDataSources = () => {
    localStorage.setItem("onprem-datasources", JSON.stringify(dataSources));
  };

  const saveManifestConfig = () => {
    localStorage.setItem(
      "onprem-manifest-config",
      JSON.stringify(manifestConfig)
    );
  };

  const addDataSource = () => {
    if (!newDataSource.name) return;

    const dataSource: DataSourceConfig = {
      id: Date.now().toString(),
      type: newDataSource.type || "sql",
      name: newDataSource.name,
      connectionString: newDataSource.connectionString,
      filePath: newDataSource.filePath,
      apiEndpoint: newDataSource.apiEndpoint,
      credentials: newDataSource.credentials,
      queryTemplate: newDataSource.queryTemplate,
      status: "disconnected",
    };

    setDataSources([...dataSources, dataSource]);
    setNewDataSource({ type: "sql", name: "", status: "disconnected" });
    setShowAddForm(false);
  };

  const testConnection = async (dataSource: DataSourceConfig) => {
    // Simulate connection test
    const updatedSources = dataSources.map((ds) =>
      ds.id === dataSource.id
        ? {
            ...ds,
            status: "connected" as const,
            lastSync: new Date().toISOString(),
          }
        : ds
    );
    setDataSources(updatedSources);
  };

  const syncManifests = async () => {
    try {
      // Call Control Plane API to get latest manifest configs
      const response = await fetch(
        `${manifestConfig.controlPlaneUrl}/api/dashboard-as-code/tenants/vpi-co-ltd/dashboards`,
        {
          headers: {
            Authorization: `Bearer ${manifestConfig.licenseKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Synced manifests:", data);

        setManifestConfig((prev) => ({
          ...prev,
          lastSync: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error("Failed to sync manifests:", error);
    }
  };

  const removeDataSource = (id: string) => {
    setDataSources(dataSources.filter((ds) => ds.id !== id));
  };

  useEffect(() => {
    saveDataSources();
  }, [dataSources]);

  useEffect(() => {
    saveManifestConfig();
  }, [manifestConfig]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                OnPrem Viewer Settings
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "datasources", label: "Data Sources", icon: "🗄️" },
              { id: "manifest", label: "Manifest Sync", icon: "📋" },
              { id: "system", label: "System Info", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Data Sources Tab */}
        {activeTab === "datasources" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Data Source Configuration
              </h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add Data Source
              </button>
            </div>

            {/* Add Data Source Form */}
            {showAddForm && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Add New Data Source
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Source Type
                    </label>
                    <select
                      value={newDataSource.type}
                      onChange={(e) =>
                        setNewDataSource({
                          ...newDataSource,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="sql">SQL Database</option>
                      <option value="xml">XML File</option>
                      <option value="csv">CSV File</option>
                      <option value="api">REST API</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newDataSource.name}
                      onChange={(e) =>
                        setNewDataSource({
                          ...newDataSource,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Production Database"
                    />
                  </div>

                  {newDataSource.type === "sql" && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Connection String
                        </label>
                        <input
                          type="text"
                          value={newDataSource.connectionString || ""}
                          onChange={(e) =>
                            setNewDataSource({
                              ...newDataSource,
                              connectionString: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="postgresql://user:password@localhost:5432/database"
                        />
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Examples:
                          <br />
                          • PostgreSQL: postgresql://user:pass@localhost:5432/db
                          <br />
                          • MySQL: mysql://user:pass@localhost:3306/db
                          <br />• SQLite: sqlite:/path/to/database.db
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Table Name
                        </label>
                        <input
                          type="text"
                          value={newDataSource.tableName || ""}
                          onChange={(e) =>
                            setNewDataSource({
                              ...newDataSource,
                              tableName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="data_table"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Custom Query Template (Optional)
                        </label>
                        <textarea
                          value={newDataSource.queryTemplate || ""}
                          onChange={(e) =>
                            setNewDataSource({
                              ...newDataSource,
                              queryTemplate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows={3}
                          placeholder="SELECT * FROM your_table WHERE condition = ?"
                        />
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Leave empty to use auto-generated queries based on
                          widget configuration
                        </div>
                      </div>
                    </>
                  )}

                  {(newDataSource.type === "xml" ||
                    newDataSource.type === "csv") && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        File Path
                      </label>
                      <input
                        type="text"
                        value={newDataSource.filePath || ""}
                        onChange={(e) =>
                          setNewDataSource({
                            ...newDataSource,
                            filePath: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="/path/to/data/file.xml"
                      />
                    </div>
                  )}

                  {newDataSource.type === "api" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        API Endpoint
                      </label>
                      <input
                        type="text"
                        value={newDataSource.apiEndpoint || ""}
                        onChange={(e) =>
                          setNewDataSource({
                            ...newDataSource,
                            apiEndpoint: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://api.example.com/data"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addDataSource}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Data Source
                  </button>
                </div>
              </div>
            )}

            {/* Data Sources List */}
            <div className="space-y-4">
              {dataSources.map((dataSource) => (
                <div
                  key={dataSource.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {dataSource.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            dataSource.status === "connected"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : dataSource.status === "error"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {dataSource.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Type: {dataSource.type.toUpperCase()}
                        {dataSource.lastSync && (
                          <>
                            {" | "}Last Sync:{" "}
                            {new Date(dataSource.lastSync).toLocaleString()}
                          </>
                        )}
                      </p>
                      {dataSource.connectionString && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">
                          {dataSource.connectionString.replace(
                            /password=[^;]*/g,
                            "password=***"
                          )}
                        </p>
                      )}
                      {dataSource.filePath && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">
                          📁 {dataSource.filePath}
                        </p>
                      )}
                      {dataSource.apiEndpoint && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">
                          🌐 {dataSource.apiEndpoint}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => testConnection(dataSource)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => removeDataSource(dataSource.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {dataSources.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-xl mb-4">🗄️</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Data Sources Configured
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Add a data source to start importing data for your
                    dashboards.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manifest Sync Tab */}
        {activeTab === "manifest" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Manifest Synchronization
            </h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Control Plane Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Control Plane URL
                  </label>
                  <input
                    type="text"
                    value={manifestConfig.controlPlaneUrl}
                    onChange={(e) =>
                      setManifestConfig({
                        ...manifestConfig,
                        controlPlaneUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    License Key
                  </label>
                  <input
                    type="password"
                    value={manifestConfig.licenseKey}
                    onChange={(e) =>
                      setManifestConfig({
                        ...manifestConfig,
                        licenseKey: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sync Interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={manifestConfig.syncInterval}
                    onChange={(e) =>
                      setManifestConfig({
                        ...manifestConfig,
                        syncInterval: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Version
                  </label>
                  <input
                    type="text"
                    value={manifestConfig.version}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {manifestConfig.lastSync ? (
                    <>
                      Last Sync:{" "}
                      {new Date(manifestConfig.lastSync).toLocaleString()}
                    </>
                  ) : (
                    "Never synced"
                  )}
                </div>
                <button
                  onClick={syncManifests}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🔄 Sync Now
                </button>
              </div>
            </div>

            {/* Version Control Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                📋 Dashboard Version Control
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>
                  • OnPrem Viewer automatically syncs dashboard manifests from
                  Control Plane API
                </p>
                <p>• Each dashboard configuration is versioned and tracked</p>
                <p>• Local cache ensures dashboards work even when offline</p>
                <p>
                  • Customer data stays on-premises - only configuration is
                  synced
                </p>
              </div>
            </div>
          </div>
        )}

        {/* System Info Tab */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              System Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Application Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Version:
                    </span>
                    <span className="text-gray-900 dark:text-white">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Environment:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Production
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Build Date:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Runtime Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Platform:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      OnPrem Viewer
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Mode:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Localhost
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Data Sources:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {dataSources.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Explanation */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h4 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                🏗️ OnPrem Architecture
              </h4>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <p>
                  <strong>1. Manifest Sync:</strong> Dashboard configurations
                  are synced from Control Plane API with version control
                </p>
                <p>
                  <strong>2. Local Data:</strong> Customer data stays
                  on-premises using configured data sources
                </p>
                <p>
                  <strong>3. Offline Support:</strong> Cached manifests ensure
                  dashboards work without internet connectivity
                </p>
                <p>
                  <strong>4. Security:</strong> Only metadata and configuration
                  sync - no customer data leaves premises
                </p>
                <p>
                  <strong>5. Flexibility:</strong> Support for SQL databases,
                  XML/CSV files, and API endpoints
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SAMPLE_DATASETS, SampleDataset } from "@/data/sample-datasets";

interface SampleDataSelectorProps {
  onDataSelect: (dataset: SampleDataset) => void;
  onCancel: () => void;
}

export default function SampleDataSelector({
  onDataSelect,
  onCancel,
}: SampleDataSelectorProps) {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const handleSelect = () => {
    const dataset = SAMPLE_DATASETS.find((d) => d.id === selectedDataset);
    if (dataset) {
      onDataSelect(dataset);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Choose Sample Dataset</h3>
        <p className="text-gray-600">
          Select a sample dataset to get started quickly with your dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {SAMPLE_DATASETS.map((dataset) => (
          <div
            key={dataset.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedDataset === dataset.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedDataset(dataset.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{dataset.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">{dataset.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {dataset.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {dataset.category}
                  </span>
                  <span>{dataset.columns.length} columns</span>
                  <span>{dataset.data.length} rows</span>
                </div>
              </div>
            </div>

            {selectedDataset === dataset.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-medium mb-2">Columns:</h5>
                <div className="grid grid-cols-2 gap-2">
                  {dataset.columns.slice(0, 6).map((col, index) => (
                    <div key={index} className="text-xs">
                      <span className="font-medium">{col.name}</span>
                      <span className="text-gray-500 ml-1">({col.type})</span>
                    </div>
                  ))}
                  {dataset.columns.length > 6 && (
                    <div className="text-xs text-gray-500">
                      +{dataset.columns.length - 6} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSelect}
          disabled={!selectedDataset}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Use This Dataset
        </Button>
      </div>
    </Card>
  );
}

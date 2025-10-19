"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import { Stop } from "@/components/Map";
import { FeatureCollection } from "geojson";

interface Prefecture {
  code: string;
  name: string;
}

export default function Home() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [meshData, setMeshData] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMeshLoading, setIsMeshLoading] = useState(false);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [selectedPref, setSelectedPref] = useState('');

  const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => <p className="text-center mt-10">地図を読み込んでいます...</p>,
  });

  useEffect(() => {
    const loadGovData = async () => {
      const prefRes = await fetch('/data/prefectures.json');
      const prefData = await prefRes.json();
      setPrefectures(prefData);
    };
    loadGovData();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    const parsePromises = Array.from(files).map(file => {
      return new Promise<Stop[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const validStops = results.data
              .map((row: any) => ({
                stop_name: row.stop_name,
                stop_lat: parseFloat(row.stop_lat),
                stop_lon: parseFloat(row.stop_lon),
              }))
              .filter(stop => !isNaN(stop.stop_lat) && !isNaN(stop.stop_lon));
            resolve(validStops as Stop[]);
          },
          error: (error) => {
            console.error(`Error parsing ${file.name}:`, error);
            reject(error);
          }
        });
      });
    });

    Promise.all(parsePromises)
      .then(allStopsArrays => {
        const newStops = allStopsArrays.flat();
        setStops(prevStops => [...prevStops, ...newStops]);
      })
      .catch(error => {
        alert("ファイルの解析中にエラーが発生しました。");
        console.error("File parsing failed:", error);
      })
      .finally(() => {
        setIsLoading(false);
        event.target.value = '';
      });
  };

  const handleClearStops = () => {
    setStops([]);
  };

  const handleFetchMesh = async () => {
    if (!selectedPref) {
      alert("都道府県を選択してください。");
      return;
    }
    setIsMeshLoading(true);
    setMeshData(null);

    try {
      const filePath = `/mesh_data/${selectedPref}.json`;
      const res = await fetch(filePath);
      if (!res.ok) throw new Error("Local file not found");
      const data = await res.json();
      setMeshData(data);
    } catch (error) {
      console.error("Failed to fetch local mesh data:", error);
      alert("選択された都道府県の人口メッシュデータは利用できません。");
    } finally {
      setIsMeshLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-screen">
      <div className="w-2/5 max-w-xl bg-gray-50 border-r border-gray-200 h-screen p-6 overflow-y-auto">
        <div className="space-y-8">
          <h1 className="text-2xl font-bold text-gray-800 text-center">交通空白地帯 可視化まっぷ</h1>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold border-b pb-2">Step 1: バス停データを表示</h2>
            <p className="text-sm text-gray-600">
              GTFSの`stops.txt`ファイルを1つまたは複数選択
            </p>
            <label htmlFor="gtfs-upload" className={`w-full text-center inline-block font-bold py-2 px-4 rounded cursor-pointer text-white ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'}`}>
              {isLoading ? '処理中...' : 'stops.txt を選択 (複数可)'}
            </label>
            <input
              id="gtfs-upload"
              type="file"
              accept=".txt,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
              multiple
            />
            {stops.length > 0 && (
              <p className="text-sm text-center text-gray-600">
                現在 {stops.length} 件のバス停が表示されています
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold border-b pb-2">Step 2: 人口メッシュを重ねる</h2>
            <p className="text-sm text-gray-600">都道府県を選択して人口データを表示</p>
            <div>
              <label htmlFor="pref-select" className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
              <select id="pref-select" value={selectedPref} onChange={(e) => setSelectedPref(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">選択してください</option>
                {prefectures.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>
            <button onClick={handleFetchMesh} disabled={isMeshLoading || !selectedPref} className={`w-full font-bold py-2 px-4 rounded text-white ${isMeshLoading || !selectedPref ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-700'}`}>
              {isMeshLoading ? '取得中...' : '人口データを表示'}
            </button>
          </div>
        </div>
      </div>
      <div className="w-full h-full">
        <Map stops={stops} meshData={meshData} onClearStops={handleClearStops} />
      </div>
    </main>
  );
}
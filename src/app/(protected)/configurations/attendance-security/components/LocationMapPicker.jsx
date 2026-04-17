"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/Card";
import { Label } from "@/components/common/Label";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { AlertCircle, MapPin, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const defaultCenter = {
  lat: 21.0277613, // Hà Nội
  lng: 105.8320725,
};

const toFiniteNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
};

export default function LocationMapPicker({
  latitude,
  longitude,
  onLocationSelect,
  disabled = false,
  label = "Chọn vị trí văn phòng",
  description = "Nhấp vào bản đồ để chọn vị trí",
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [markerPosition, setMarkerPosition] = useState({
    lat: toFiniteNumberOrNull(latitude) ?? defaultCenter.lat,
    lng: toFiniteNumberOrNull(longitude) ?? defaultCenter.lng,
  });
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Keep markerPosition in sync with incoming props (and normalize to numbers)
  useEffect(() => {
    const nextLat = toFiniteNumberOrNull(latitude);
    const nextLng = toFiniteNumberOrNull(longitude);
    if (nextLat === null || nextLng === null) return;
    setMarkerPosition((prev) => {
      if (prev.lat === nextLat && prev.lng === nextLng) return prev;
      return { lat: nextLat, lng: nextLng };
    });
  }, [latitude, longitude]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Tránh khởi tạo lại nếu map đã tồn tại
    if (map.current) return;

    map.current = L.map(mapContainer.current).setView(
      [markerPosition.lat, markerPosition.lng],
      17
    );

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Add marker
    marker.current = L.marker([markerPosition.lat, markerPosition.lng])
      .addTo(map.current)
      .bindPopup("Vị trí văn phòng");

    // Handle map click
    if (!disabled) {
      map.current.on("click", handleMapClick);
    }

    return () => {
      if (map.current) {
        map.current.off("click", handleMapClick);
      }
    };
  }, []);

  // Update marker when position changes
  useEffect(() => {
    if (map.current && marker.current) {
      marker.current.setLatLng([markerPosition.lat, markerPosition.lng]);
      map.current.panTo([markerPosition.lat, markerPosition.lng]);
    }
  }, [markerPosition]);

  const handleMapClick = (e) => {
    if (disabled) return;

    const newPosition = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    };
    setMarkerPosition(newPosition);
    fetchAddress(newPosition.lat, newPosition.lng);
  };

  // Fetch address using Nominatim (OpenStreetMap's free geocoding service)
  const fetchAddress = async (lat, lng) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "Accept-Language": "vi-VN,vi;q=0.9",
          },
        }
      );
      const data = await response.json();
      if (data.address) {
        setAddress(data.display_name || "");
        setSearchInput(data.display_name || "");
      }
    } catch (error) {
      console.error("Failed to fetch address:", error);
      setAddress("Không thể lấy địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  // Search for address suggestions from Nominatim
  const searchAddress = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=vi-VN,vi`,
        {
          headers: {
            "Accept-Language": "vi-VN,vi;q=0.9",
          },
        }
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Failed to search address:", error);
      setSuggestions([]);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    const newPosition = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };
    setMarkerPosition(newPosition);
    setAddress(suggestion.display_name);
    setSearchInput(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleConfirmLocation = () => {
    onLocationSelect({
      latitude: markerPosition.lat,
      longitude: markerPosition.lng,
      address,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {label}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── SEARCH INPUT ── */}
        <div className="relative">
          <Label htmlFor="address-search" className="text-sm font-medium mb-2 block">
            Tìm vị trí
          </Label>
          <div className="relative">
            <Input
              id="address-search"
              type="text"
              placeholder="Nhập địa chỉ, thành phố..."
              value={searchInput}
              onChange={handleSearchChange}
              disabled={disabled}
              className="pr-10"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── SUGGESTIONS DROPDOWN ── */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-100 border-b border-slate-100 last:border-b-0 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-900 line-clamp-1">
                    {suggestion.address?.village ||
                      suggestion.address?.town ||
                      suggestion.address?.city ||
                      "Chưa biết"}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {suggestion.display_name}
                  </p>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && searchInput && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4">
              <p className="text-sm text-slate-500 text-center">
                Không tìm thấy kết quả
              </p>
            </div>
          )}
        </div>
        <div
          ref={mapContainer}
          style={{
            width: "100%",
            height: "400px",
            borderRadius: "0.5rem",
            border: "1px solid #e2e8f0",
          }}
        />

        {/* Thông tin vị trí */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-slate-600">Vĩ độ</Label>
              <p className="text-sm font-mono font-semibold text-slate-900">
                {Number.isFinite(markerPosition.lat)
                  ? markerPosition.lat.toFixed(6)
                  : "--"}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Kinh độ</Label>
              <p className="text-sm font-mono font-semibold text-slate-900">
                {Number.isFinite(markerPosition.lng)
                  ? markerPosition.lng.toFixed(6)
                  : "--"}
              </p>
            </div>
          </div>

          {address && (
            <div>
              <Label className="text-xs font-medium text-slate-600">Địa chỉ</Label>
              <p className="text-sm text-slate-700 line-clamp-2">{address}</p>
            </div>
          )}

          <Button
            onClick={handleConfirmLocation}
            disabled={disabled || loading}
            variant="primary"
            className="w-full"
          >
            {loading ? "Đang cập nhật..." : "Xác nhận vị trí"}
          </Button>
        </div>

        {disabled && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Vui lòng bật{"Yêu cầu kiểm tra vị trí"} để chỉnh sửa
          </p>
        )}
      </CardContent>
    </Card>
  );
}

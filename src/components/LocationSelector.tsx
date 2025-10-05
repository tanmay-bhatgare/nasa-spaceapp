"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2 } from "lucide-react"
import { GeocodingResult, GeocodingResponse, SelectedLocation } from "@/types/weather"

interface LocationSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string } | null) => void
}

export default function LocationSelector({ onLocationSelect }: LocationSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSearchResults([])
        setIsSearching(false)
        setShowResults(false)
        return
      }

      setIsSearching(true)
      setShowResults(true)
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch locations')
        }
        
        const data: GeocodingResponse = await response.json()
        setSearchResults(data.results || [])
      } catch (error) {
        console.error('Error searching locations:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    setDebounceTimer(timer)
  }, [debounceTimer])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  // Handle location selection
  const handleLocationSelect = (result: GeocodingResult) => {
    const location: SelectedLocation = {
      id: result.id.toString(),
      name: result.name,
      displayName: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}${result.country ? `, ${result.country}` : ''}`,
      coordinates: {
        lat: result.latitude,
        lon: result.longitude
      },
      country: result.country,
      admin1: result.admin1,
      admin2: result.admin2
    }
    
    // Update internal state
    setSelectedLocation(location)
    setSearchQuery(location.displayName)
    setSearchResults([])
    setShowResults(false)
    
    // Call parent callback with expected format
    onLocationSelect({
      lat: result.latitude,
      lng: result.longitude,
      name: location.displayName
    })
    
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true)
    }
  }

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (resultsRef.current && !resultsRef.current.contains(target) && 
          inputRef.current && !inputRef.current.contains(target)) {
        setShowResults(false)
      }
    }

    // Use a slight delay to ensure click events on options are processed first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Select Location</span>
        </CardTitle>
        <CardDescription>
          Search for a location to analyze weather conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Input
              ref={inputRef}
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleInputFocus}
              className="w-full"
            />
            
            {/* Search Results Dropdown */}
            {showResults && (
              <div 
                ref={resultsRef}
                className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                )}
                
                {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No locations found.
                  </div>
                )}
                
                {!isSearching && searchQuery.length < 2 && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Type at least 2 characters to search.
                  </div>
                )}
                
                {!isSearching && searchResults.length > 0 && (
                  <div className="py-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        className="w-full px-3 py-2 hover:bg-muted cursor-pointer transition-colors text-left focus:bg-muted focus:outline-none"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleLocationSelect(result)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                        }}
                      >
                        <div className="flex items-center space-x-2 pointer-events-none">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.admin1 && `${result.admin1}, `}{result.country}
                              {result.population && ` • Pop: ${result.population.toLocaleString()}`}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0">
                            {result.latitude.toFixed(2)}, {result.longitude.toFixed(2)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {selectedLocation && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <p className="font-medium">Selected: {selectedLocation.displayName}</p>
                <p className="text-muted-foreground">
                  Coordinates: {selectedLocation.coordinates.lat.toFixed(4)}°N, 
                  {Math.abs(selectedLocation.coordinates.lon).toFixed(4)}°W
                </p>
                {selectedLocation.country && (
                  <p className="text-muted-foreground">
                    Country: {selectedLocation.country}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

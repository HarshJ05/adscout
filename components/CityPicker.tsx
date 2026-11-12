'use client';

import { Dropdown, Option } from '@fluentui/react-components';
import { CITIES, cityById } from '@/lib/cities';
import { useLocalStore } from '@/lib/store';
import { cityStore } from '@/lib/stores';

/** Choose the city to search. Saved in the browser and shared by every page. */
export function CityPicker({ disabled, compact }: { disabled?: boolean; compact?: boolean }) {
  const id = useLocalStore(cityStore);
  const city = cityById(id);
  return (
    <Dropdown
      aria-label="City"
      className={compact ? 'city-picker compact' : 'city-picker'}
      value={city.name}
      selectedOptions={[city.id]}
      onOptionSelect={(_, d) => d.optionValue && cityStore.set(d.optionValue)}
      disabled={disabled}
      style={{ minWidth: compact ? 140 : 200 }}
    >
      {CITIES.map((c) => (
        <Option key={c.id} value={c.id} text={c.name}>{c.name}</Option>
      ))}
    </Dropdown>
  );
}

/** The selected city as a City object. */
export function useCity() {
  return cityById(useLocalStore(cityStore));
}

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { MicroCircle } from '@/types';
import { hapticFeedback } from '@/utils/haptics';
import { useThemedStyles } from '@/context/theme-context';
import { getCommunityColor } from '@/utils/metro-colors';

const { width } = Dimensions.get('window');

const INDIAN_CITIES = [
  'All Cities',
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Gurgaon',
  'Noida',
  'Pune',
  'Hyderabad',
  'Goa',
  'Kolkata',
  'Chennai',
];

interface MicroCommunityModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (community: MicroCircle | null) => void;
  onSelectMultiple?: (communities: MicroCircle[]) => void;
  selectedName?: string | null;
  selectedNames?: string[];
  selectedId?: string | null;
  selectedIds?: string[];
  maxSelections?: number;
  title?: string;
  subtitle?: string;
  initialCity?: string;
}

export default function MicroCommunityModal({
  visible,
  onClose,
  onSelect,
  onSelectMultiple,
  selectedName,
  selectedNames,
  selectedId,
  selectedIds,
  maxSelections = 5,
  title = 'Micro-Community Circles 🏙️',
  subtitle = 'Join up to 5 communities & match across your lifestyle subcultures',
  initialCity,
}: MicroCommunityModalProps) {
  const styles = useThemedStyles(baseStyles);
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState<MicroCircle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedList, setSelectedList] = useState<MicroCircle[]>([]);

  useEffect(() => {
    if (visible) {
      let startCity = 'All Cities';
      if (initialCity) {
        const found = INDIAN_CITIES.find(
          (c) =>
            c.toLowerCase() === initialCity.toLowerCase() ||
            (c === 'Delhi NCR' && (initialCity.toLowerCase().includes('delhi') || initialCity.toLowerCase().includes('ncr'))) ||
            (c === 'Gurgaon' && initialCity.toLowerCase().includes('gur')) ||
            (c === 'Noida' && initialCity.toLowerCase().includes('noid'))
        );
        if (found) {
          startCity = found;
        }
      }
      setSelectedCity(startCity);
      setSearchQuery('');
      loadCommunities(startCity === 'All Cities' ? undefined : startCity);
    }
  }, [visible, initialCity]);

  // Sync initial selections
  useEffect(() => {
    if (visible && communities.length > 0) {
      const activeNames = selectedNames && selectedNames.length > 0
        ? selectedNames
        : (selectedName ? [selectedName] : []);
      
      const preselected: MicroCircle[] = [];
      activeNames.forEach((name) => {
        const found = communities.find(
          (c) => c.name.toLowerCase() === name.toLowerCase() || c.slug?.toLowerCase() === name.toLowerCase()
        );
        if (found) {
          preselected.push(found);
        } else {
          // create stub so user's existing community is preserved
          preselected.push({
            id: name,
            name,
            city: initialCity || 'Bengaluru',
            description: 'Local Community Circle',
            vibeCategory: 'LIFESTYLE',
            badgeIcon: '🏙️',
            icon: '🏙️',
            activeMembers: 150,
          });
        }
      });
      setSelectedList(preselected.slice(0, maxSelections));
    }
  }, [visible, communities]);

  const loadCommunities = async (city?: string) => {
    setLoading(true);
    try {
      const data = await api.getMicroCircles(city);
      setCommunities(data);
    } catch (e) {
      console.warn('Failed to load micro-communities:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (city: string) => {
    hapticFeedback.selection();
    setSelectedCity(city);
    loadCommunities(city === 'All Cities' ? undefined : city);
  };

  const filteredCommunities = communities.filter((item) => {
    const matchesCity = (() => {
      if (selectedCity === 'All Cities') return true;
      if (!item.city) return true;
      const c1 = item.city.trim().toLowerCase();
      const c2 = selectedCity.trim().toLowerCase();
      return (
        c1 === c2 ||
        (c2 === 'gurgaon' && (c1.includes('gurgaon') || c1.includes('gurugram'))) ||
        (c2 === 'delhi ncr' && (c1.includes('delhi') || c1.includes('ncr'))) ||
        (c2 === 'noida' && (c1.includes('noida') || c1.includes('greater noida')))
      );
    })();

    if (!matchesCity) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(query);
    const tagMatch = item.tagline?.toLowerCase().includes(query);
    const descMatch = item.description?.toLowerCase().includes(query);
    const cityMatch = item.city?.toLowerCase().includes(query);
    return nameMatch || tagMatch || descMatch || cityMatch;
  });

  const handleToggleCommunity = (item: MicroCircle) => {
    const isAlreadySelected = selectedList.some(
      (c) => c.id === item.id || c.name.toLowerCase() === item.name.toLowerCase()
    );

    if (isAlreadySelected) {
      hapticFeedback.light();
      setSelectedList((prev) =>
        prev.filter((c) => c.id !== item.id && c.name.toLowerCase() !== item.name.toLowerCase())
      );
    } else {
      if (selectedList.length >= maxSelections) {
        hapticFeedback.warning();
        alert(`You can join up to ${maxSelections} communities. Deselect an existing circle to add this one.`);
        return;
      }
      hapticFeedback.selection();
      setSelectedList((prev) => [...prev, item]);
    }
  };

  const handleRemoveChip = (name: string) => {
    hapticFeedback.light();
    setSelectedList((prev) => prev.filter((c) => c.name.toLowerCase() !== name.toLowerCase()));
  };

  const handleConfirm = () => {
    hapticFeedback.success();
    if (onSelectMultiple) {
      onSelectMultiple(selectedList);
    }
    if (onSelect) {
      onSelect(selectedList[0] || null);
    }
    onClose();
  };

  const handleClear = () => {
    hapticFeedback.light();
    setSelectedList([]);
    if (onSelectMultiple) {
      onSelectMultiple([]);
    }
    if (onSelect) {
      onSelect(null);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search neighborhood (e.g. Koramangala, Bandra, Hauz Khas)..."
            placeholderTextColor="#6B7082"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: '#8E94A5', fontSize: 13, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active Selections Bar (Up to 5 Communities) */}
        <View style={styles.selectionBar}>
          <View style={styles.selectionBarHeader}>
            <Text style={styles.selectionBarTitle}>JOINED COMMUNITIES</Text>
            <Text style={styles.selectionBarCount}>
              {selectedList.length}/{maxSelections} Selected
            </Text>
          </View>
          {selectedList.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {selectedList.map((c) => {
                const colorConfig = getCommunityColor(c.slug || c.name, c.vibeCategory);
                return (
                  <View
                    key={c.id || c.name}
                    style={[
                      styles.chipItem,
                      {
                        backgroundColor: colorConfig.tagBg,
                        borderColor: colorConfig.tagBorder,
                        borderWidth: 1,
                      },
                    ]}>
                    <Text style={[styles.chipText, { color: colorConfig.textColor }]} numberOfLines={1}>
                      {colorConfig.emoji} {c.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveChip(c.name)}
                      style={[styles.chipRemoveBtn, { backgroundColor: colorConfig.tagBorder }]}>
                      <Text style={[styles.chipRemoveText, { color: colorConfig.textColor }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.selectionHint}>
              Join up to 5 neighborhood, marathon, solo travel or live concert circles to match across all
            </Text>
          )}
        </View>

        {/* City Filter Pills */}
        <View style={styles.cityPillsWrapper}>
          <FlatList
            horizontal
            data={INDIAN_CITIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityPillsScroll}
            renderItem={({ item }) => {
              const isActive = selectedCity === item;
              return (
                <TouchableOpacity
                  style={[styles.cityPill, isActive && styles.cityPillActive]}
                  onPress={() => handleCityChange(item)}>
                  <Text style={[styles.cityPillText, isActive && styles.cityPillTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Community List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={styles.loadingText}>Loading Indian Urban Circles...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCommunities}
            keyExtractor={(item) => item.id || item.slug || item.name}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedList.some(
                (c) => c.id === item.id || c.name.toLowerCase() === item.name.toLowerCase()
              );
              const colorConfig = getCommunityColor(item.slug || item.name, item.vibeCategory);

              return (
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      borderColor: colorConfig.cardBorder,
                      backgroundColor: isSelected ? '#10222D' : colorConfig.cardBg,
                      borderLeftWidth: 4,
                      borderLeftColor: colorConfig.primary,
                    },
                    isSelected && styles.cardSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleToggleCommunity(item)}>
                  <View
                    style={[
                      styles.badgeCircle,
                      {
                        backgroundColor: colorConfig.badgeBg,
                        borderColor: colorConfig.badgeBorder,
                        borderWidth: 1.5,
                      },
                    ]}>
                    <Text style={styles.badgeIcon}>{item.badgeIcon || colorConfig.emoji || '🏙️'}</Text>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: colorConfig.textColor },
                          isSelected && styles.cardTitleSelected,
                        ]}
                        numberOfLines={1}>
                        {item.name}
                      </Text>
                      {isSelected ? (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkBadgeText}>✓ JOINED</Text>
                        </View>
                      ) : (
                        <View style={styles.joinActionPill}>
                          <Text style={styles.joinActionPillText}>+ JOIN</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardTagline} numberOfLines={2}>
                      {item.tagline || item.description}
                    </Text>

                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.metaPill,
                          {
                            backgroundColor: colorConfig.tagBg,
                            borderColor: colorConfig.tagBorder,
                            borderWidth: 1,
                          },
                        ]}>
                        <Text style={[styles.metaPillText, { color: colorConfig.tagText, fontWeight: '800' }]}>
                          {colorConfig.emoji} {colorConfig.name.toUpperCase()}
                        </Text>
                      </View>
                      {item.city && (
                        <View style={styles.metaPill}>
                          <Text style={styles.metaPillText}>📍 {item.city}</Text>
                        </View>
                      )}
                      {item.vibeCategory && (
                        <View style={[styles.metaPill, styles.vibePill]}>
                          <Text style={styles.vibePillText}>✨ {item.vibeCategory}</Text>
                        </View>
                      )}
                      {item.activeMembers ? (
                        <Text style={styles.membersCount}>
                          👥 {item.activeMembers.toLocaleString()} members
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏙️</Text>
                <Text style={styles.emptyTitle}>No Circles Found</Text>
                <Text style={styles.emptySubtitle}>
                  Try selecting "All Cities" or searching for a different neighborhood.
                </Text>
              </View>
            }
          />
        )}

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>
              Confirm ({selectedList.length}/{maxSelections}) ➔
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F222A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1C1E24',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  cityPillsWrapper: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1C23',
  },
  cityPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1A1C23',
    borderWidth: 1,
    borderColor: '#262A34',
  },
  cityPillActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  cityPillText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '600',
  },
  cityPillTextActive: {
    color: '#08080E',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16181F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#232733',
  },
  cardSelected: {
    borderColor: '#00E5FF',
    backgroundColor: '#10222D',
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#202430',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeIcon: {
    fontSize: 22,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  cardTitleSelected: {
    color: '#00E5FF',
  },
  checkBadge: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  checkBadgeText: {
    color: '#08080E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTagline: {
    color: '#A0A6B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    backgroundColor: '#222530',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaPillText: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '600',
  },
  vibePill: {
    backgroundColor: '#2E2310',
  },
  vibePillText: {
    color: '#FFB800',
    fontSize: 10,
    fontWeight: '700',
  },
  membersCount: {
    color: '#6B7082',
    fontSize: 10,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#8E94A5',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#8E94A5',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 17,
  },
  selectionBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#13151D',
    borderBottomWidth: 1,
    borderBottomColor: '#1F222A',
  },
  selectionBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectionBarTitle: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  selectionBarCount: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '800',
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    gap: 6,
    maxWidth: 240,
  },
  chipText: {
    color: '#E0F7FA',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  chipRemoveBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  selectionHint: {
    color: '#6B7082',
    fontSize: 11,
    paddingBottom: 4,
  },
  joinActionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  joinActionPillText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F222A',
    backgroundColor: '#12141A',
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#1C1E26',
    borderWidth: 1,
    borderColor: '#2F3444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#A0A6B8',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#00E5FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';
import { Vehicle, FuelType, VehicleCategory } from '../types';
import {
  getAllVehicles,
  setActiveVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../db/client';

interface VehicleSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
  onVehicleSelected: (vehicle: Vehicle) => void;
}

export function VehicleSwitcherModal({
  visible,
  onClose,
  onVehicleSelected,
}: VehicleSwitcherModalProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<VehicleCategory>('4-wheeler');
  const [formPlate, setFormPlate] = useState('');
  const [formFuelType, setFormFuelType] = useState<FuelType>('petrol');

  const loadVehicles = async () => {
    try {
      const all = await getAllVehicles();
      setVehicles(all);
    } catch (e) {
      console.error('Failed to load vehicles', e);
    }
  };

  useEffect(() => {
    if (visible) {
      loadVehicles();
      setIsAdding(false);
      setEditingId(null);
    }
  }, [visible]);

  const handleSelectVehicle = async (v: Vehicle) => {
    try {
      if (Platform.OS !== 'web') {
        try {
          await Haptics.selectionAsync();
        } catch {}
      }
      await setActiveVehicle(v.id);
      await loadVehicles();
      onVehicleSelected(v);
      onClose();
    } catch (e) {
      console.error('Failed to set active vehicle', e);
    }
  };

  const handleStartAdd = () => {
    setFormName('');
    setFormCategory('4-wheeler');
    setFormPlate('');
    setFormFuelType('petrol');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (v: Vehicle) => {
    setFormName(v.name);
    setFormCategory(v.category || '4-wheeler');
    setFormPlate(v.license_plate || '');
    setFormFuelType(v.fuel_type);
    setEditingId(v.id);
    setIsAdding(false);
  };

  const handleSaveVehicle = async () => {
    if (!formName.trim()) {
      Alert.alert('Vehicle Name Required', 'Please enter a name for the vehicle.');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      if (editingId) {
        await updateVehicle({
          id: editingId,
          name: formName,
          category: formCategory,
          license_plate: formPlate,
          fuel_type: formFuelType,
        });
        setEditingId(null);
      } else {
        const created = await createVehicle({
          name: formName,
          category: formCategory,
          license_plate: formPlate,
          fuel_type: formFuelType,
        });
        setIsAdding(false);
        onVehicleSelected(created);
      }

      await loadVehicles();
    } catch (e) {
      Alert.alert('Error', 'Could not save vehicle.');
    }
  };

  const handleDeleteVehicle = (v: Vehicle) => {
    if (vehicles.length <= 1) {
      Alert.alert('Cannot Delete', 'You must keep at least one vehicle in your fleet.');
      return;
    }

    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${v.name}? Associated refueling logs will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteVehicle(v.id);
            if (success) {
              const updated = await getAllVehicles();
              setVehicles(updated);
              if (updated.length > 0) {
                onVehicleSelected(updated[0]);
              }
            }
          },
        },
      ]
    );
  };

  const fuelTypes: { type: FuelType; label: string }[] = [
    { type: 'petrol', label: 'Petrol' },
    { type: 'diesel', label: 'Diesel' },
    { type: 'cng', label: 'CNG' },
    { type: 'hybrid', label: 'Hybrid' },
    { type: 'electric', label: 'EV' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* MODAL HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCluster}>
              <MaterialCommunityIcons name="car-multiple" size={22} color={THEME.colors.primary} />
              <Text style={styles.headerTitle}>Vehicle Fleet</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{vehicles.length}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* ADD / EDIT FORM (WHEN ACTIVE) */}
            {(isAdding || editingId) && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {editingId ? 'Edit Vehicle Details' : 'Add New Vehicle to Fleet'}
                </Text>

                <Text style={styles.inputLabel}>VEHICLE TYPE</Text>
                <View style={styles.categoryToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.categoryPill,
                      formCategory === '4-wheeler' && styles.categoryPillActive,
                    ]}
                    onPress={() => setFormCategory('4-wheeler')}
                  >
                    <Ionicons
                      name="car-sport"
                      size={17}
                      color={formCategory === '4-wheeler' ? THEME.colors.primary : THEME.colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        formCategory === '4-wheeler' && styles.categoryPillTextActive,
                      ]}
                    >
                      4-Wheeler
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.categoryPill,
                      formCategory === '2-wheeler' && styles.categoryPillActive,
                    ]}
                    onPress={() => setFormCategory('2-wheeler')}
                  >
                    <MaterialCommunityIcons
                      name="motorbike"
                      size={18}
                      color={formCategory === '2-wheeler' ? THEME.colors.primary : THEME.colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        formCategory === '2-wheeler' && styles.categoryPillTextActive,
                      ]}
                    >
                      2-Wheeler
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>VEHICLE NAME</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Hyundai Creta SX, Tata Curvv"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={formName}
                  onChangeText={setFormName}
                />

                <Text style={styles.inputLabel}>LICENSE REGISTRATION (OPTIONAL)</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. KA-01-AB-1234"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={formPlate}
                  onChangeText={setFormPlate}
                  autoCapitalize="characters"
                />

                <Text style={styles.inputLabel}>FUEL TYPE</Text>
                <View style={styles.fuelTypeRow}>
                  {fuelTypes.map((ft) => (
                    <TouchableOpacity
                      key={ft.type}
                      style={[
                        styles.fuelTypePill,
                        formFuelType === ft.type && styles.fuelTypePillActive,
                      ]}
                      onPress={() => setFormFuelType(ft.type)}
                    >
                      <Text
                        style={[
                          styles.fuelTypePillText,
                          formFuelType === ft.type && styles.fuelTypePillTextActive,
                        ]}
                      >
                        {ft.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.formActionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setIsAdding(false);
                      setEditingId(null);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.saveVehicleBtn} onPress={handleSaveVehicle}>
                    <Text style={styles.saveVehicleBtnText}>
                      {editingId ? 'Save Changes' : 'Add Vehicle'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* VEHICLES LIST */}
            <Text style={styles.sectionHeader}>SAVED VEHICLES</Text>
            {vehicles.map((v) => {
              const isSelected = v.is_primary === 1;

              return (
                <View
                  key={v.id}
                  style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                >
                  <TouchableOpacity
                    style={styles.vehicleCardContent}
                    activeOpacity={0.8}
                    onPress={() => handleSelectVehicle(v)}
                  >
                    <View style={styles.vehicleLeftRow}>
                      <View
                        style={[
                          styles.carIconBox,
                          isSelected && { backgroundColor: THEME.colors.primarySubtle },
                        ]}
                      >
                        {v.category === '2-wheeler' ? (
                          <MaterialCommunityIcons
                            name="motorbike"
                            size={20}
                            color={isSelected ? THEME.colors.primary : THEME.colors.textSecondary}
                          />
                        ) : (
                          <Ionicons
                            name="car-sport"
                            size={20}
                            color={isSelected ? THEME.colors.primary : THEME.colors.textSecondary}
                          />
                        )}
                      </View>
                      <View>
                        <Text style={styles.vehicleNameText}>{v.name}</Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.plateText}>{v.license_plate || 'No Plate'}</Text>
                          <View style={styles.fuelBadge}>
                            <Text style={styles.fuelBadgeText}>{v.fuel_type.toUpperCase()}</Text>
                          </View>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                              {v.category === '2-wheeler' ? '2W' : '4W'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={THEME.colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={22} color={THEME.colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  {/* EDIT & DELETE CONTROLS */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.editActionBtn}
                      onPress={() => handleStartEdit(v)}
                    >
                      <Ionicons name="pencil-outline" size={14} color={THEME.colors.textSecondary} />
                      <Text style={styles.editActionText}>Edit</Text>
                    </TouchableOpacity>

                    {vehicles.length > 1 && (
                      <TouchableOpacity
                        style={styles.deleteActionBtn}
                        onPress={() => handleDeleteVehicle(v)}
                      >
                        <Ionicons name="trash-outline" size={14} color={THEME.colors.danger} />
                        <Text style={styles.deleteActionText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {/* BUTTON TO ADD NEW VEHICLE */}
            {!isAdding && !editingId && (
              <TouchableOpacity
                style={styles.addNewButton}
                activeOpacity={0.85}
                onPress={handleStartAdd}
              >
                <Ionicons name="add-circle-outline" size={20} color="#0B131B" />
                <Text style={styles.addNewButtonText}>Add New Vehicle</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  headerTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  countBadge: {
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.2)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  scrollArea: {
    marginTop: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  vehicleCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 12,
    overflow: 'hidden',
  },
  vehicleCardSelected: {
    borderColor: THEME.colors.primary,
  },
  vehicleCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  vehicleLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  carIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  vehicleNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  plateText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  fuelBadge: {
    backgroundColor: THEME.colors.inputBackground,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  fuelBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 194, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.3)',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editActionText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteActionText: {
    fontSize: 12,
    color: THEME.colors.danger,
    fontWeight: '600',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radii.lg,
    paddingVertical: 14,
    marginTop: 6,
    ...THEME.shadows.cyanGlow,
  },
  addNewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B131B',
  },
  categoryToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.inputBackground,
    paddingVertical: 10,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  categoryPillActive: {
    backgroundColor: THEME.colors.primarySubtle,
    borderColor: THEME.colors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  categoryPillTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.primarySubtle,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 8,
  },
  inputField: {
    backgroundColor: THEME.colors.inputBackground,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    borderWidth: 1,
    borderColor: THEME.colors.inputBorder,
  },
  fuelTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  fuelTypePill: {
    backgroundColor: THEME.colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  fuelTypePillActive: {
    backgroundColor: THEME.colors.primarySubtle,
    borderColor: THEME.colors.primary,
  },
  fuelTypePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  fuelTypePillTextActive: {
    color: THEME.colors.primary,
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.radii.lg,
  },
  cancelBtnText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  saveVehicleBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: THEME.radii.lg,
  },
  saveVehicleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B131B',
  },
});


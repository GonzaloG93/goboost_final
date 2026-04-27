// frontend/src/pages/Order.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import usePricing from '../hooks/usePricing';
import CustomNavbar from '../components/CustomNavbar';
import { 
  formatServiceType, 
  D4_BOSS_OPTIONS, 
  D4_RUN_QUANTITY_OPTIONS, 
  D4_SERVICE_MODES,
  THE_PIT_TIER_OPTIONS,
  THE_PIT_SERVICE_MODES,
  calculatePitPrice,
  MOP_RAID_CONFIG         
} from '../config/gamesConfig';
import { 
  DIABLO_4_BUILDS, 
  POE2_BUILDS, 
  WOW_TBC_PACKS, 
  BUILD_DESCRIPTIONS,
  formatPrice,
  normalizeServiceType 
} from '../config/buildsConfig';

// Import de subcomponentes desde components/order/
import Diablo4BossOptions from '../components/order/Diablo4BossOptions';
import ThePitArtificerOptions from '../components/order/ThePitArtificerOptions';
import MopRaidOptions from '../components/order/MopRaidOptions';
import DuneBaseOptions from '../components/order/DuneBaseOptions';
import DuneCraftVehicleOptions from '../components/order/DuneCraftVehicleOptions';
import DuneLevelingOptions from '../components/order/DuneLevelingOptions';
import DuneBundleOptions from '../components/order/DuneBundleOptions';
import PowerlevelingOptions from '../components/order/PowerlevelingOptions';
import ParagonLevelingOptions from '../components/order/ParagonLevelingOptions';
import Diablo4BuildOptions from '../components/order/Diablo4BuildOptions';
import PoE2BuildOptions from '../components/order/PoE2BuildOptions';
import PoE2BundleOptions from '../components/order/PoE2BundleOptions';
import TbcPackOptions from '../components/order/TbcPackOptions';
import OtherBuildOptions from '../components/order/OtherBuildOptions';
import CustomServiceOptions from '../components/order/CustomServiceOptions';
import LevelingOptions from '../components/order/LevelingOptions';
import ServiceSummary from '../components/order/ServiceSummary';

const Order = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    getMaxLevel, 
    isLevelingService, 
    getPricePerLevel,
    calculatePrice: calculatePriceFromPricing,
    getPriceBreakdown
  } = usePricing();

  // ✅ VALIDACIÓN DE ID DE SERVICIO – Redirige si no es un ObjectId válido
  useEffect(() => {
    if (!serviceId || serviceId === 'undefined' || !/^[a-f\d]{24}$/i.test(serviceId)) {
      console.warn('❌ ID de servicio inválido:', serviceId);
      navigate('/services', { replace: true });
    }
  }, [serviceId, navigate]);

  const hasFetchedRef = useRef(false);
  const initialPrice = location.state?.fixedPrice || 0;

  // Estados principales
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentBreakdown, setCurrentBreakdown] = useState([]);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [maxLevel, setMaxLevel] = useState(100);
  const [pricePerLevel, setPricePerLevelState] = useState(0.17);

  // Boss Killing D4 States
  const [selectedBoss, setSelectedBoss] = useState('andariel');
  const [runQuantity, setRunQuantity] = useState(50);
  const [serviceMode, setServiceMode] = useState('self');
  const [includeMaterials, setIncludeMaterials] = useState(false);
  const [materialSets, setMaterialSets] = useState(50);

  // MoP Raid States
  const [mopRaidOption, setMopRaidOption] = useState('');
  const [mopPriorityLoot, setMopPriorityLoot] = useState(false);
  const [mopExtraItems, setMopExtraItems] = useState(false);

  // The Pit Artificer States
  const [pitTier, setPitTier] = useState('tier3');
  const [pitRuns, setPitRuns] = useState(10);
  const [pitMode, setPitMode] = useState('self');

  // Builds States
  const [selectedBuilds, setSelectedBuilds] = useState({ starter: false, ancestral: false, mythic: false, tormented: false });
  const [selectedPoE2Builds, setSelectedPoE2Builds] = useState({ starter: false, advanced: false, endgame: false });
  const [addBuildToLeveling, setAddBuildToLeveling] = useState(false);
  const [selectedLevelingBuildTier, setSelectedLevelingBuildTier] = useState('starter');
  const [buildSpecifications, setBuildSpecifications] = useState('');

  // Dune States
  const [selectedDuneBaseSize, setSelectedDuneBaseSize] = useState('');
  const [addDefenses, setAddDefenses] = useState(false);
  const [addAutomation, setAddAutomation] = useState(false);
  const [addResources, setAddResources] = useState(false);
  const [addClassUnlock, setAddClassUnlock] = useState(false);
  const [selectedDuneClass, setSelectedDuneClass] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedMKKey, setSelectedMKKey] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    accountName: '', password: '', gameUsername: '', server: '', notes: '',
    quantity: 1, currentLevel: 1, desiredLevel: 10,
    faction: 'Aldor', profession: 'Alchemy', secondProfession: 'Blacksmithing',
    customPrice: 0, selectedOption: ''
  });

  // Configuraciones derivadas
  const baseSizes = service?.baseConfig?.availableSizes || [];
  const availableAddons = service?.baseConfig?.availableAddons || [];
  const selectedBaseConfig = baseSizes.find(b => b.key === selectedDuneBaseSize);
  const vehicleConfig = service?.vehicleConfig || {};
  const availableVehicles = vehicleConfig.availableVehicles || [];
  const selectedVehicleConfig = availableVehicles.find(v => v.key === selectedVehicle);
  const selectedMK = selectedVehicleConfig?.mkOptions?.find(m => m.key === selectedMKKey);
  const selectedBossConfig = D4_BOSS_OPTIONS.find(b => b.value === selectedBoss);
  const selectedQuantityConfig = D4_RUN_QUANTITY_OPTIONS.find(q => q.value === runQuantity);

  // ========== HELPER FUNCTIONS ==========
  const isLeveling = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return isLevelingService(service.serviceType) || 
           ['poe2_leveling_40', 'poe2_leveling_70', 'poe2_leveling_90'].includes(normalized);
  }, [service, isLevelingService]);

  const isPowerleveling = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'powerleveling' || 
           normalized === 'leveling' ||
           normalized === 'power_leveling' ||
           normalized.includes('powerlevel');
  }, [service]);

  const isParagonLeveling = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'paragon_leveling' || 
           normalized === 'paragonleveling' ||
           normalized.includes('paragon');
  }, [service]);

  const isWowTbcPack = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'tbc_starter_pack' || normalized === 'tbc_endgame_pack';
  }, [service]);

  const isDiablo4Build = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized.startsWith('builds_');
  }, [service]);

  const isPoE2Build = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized.startsWith('poe2_build_');
  }, [service]);

  const isPoE2Bundle = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'poe2_starter_pack' || normalized === 'poe2_endgame_pack';
  }, [service]);

  const isBossKillingD4 = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'boss_killing' && service.game === 'Diablo 4';
  }, [service]);

  const isThePitArtificer = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'the_pit_artificer' && service.game === 'Diablo 4';
  }, [service]);

  const isMopRaid = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return ['mop_mogushan_vaults', 'mop_heart_of_fear', 'mop_terrace_endless_spring', 'mop_throne_of_thunder'].includes(normalized);
  }, [service]);

  const isOtherBuild = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized.includes('poe_starter_build') || 
           normalized.includes('poe_endgame_build') ||
           normalized.includes('d2_') ||
           normalized === 'custom_build';
  }, [service]);

  const supportsQuantity = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return ['boss_killing', 'mythic_plus', 'wins', 'coaching', 'dungeon_clearing', 'currency_farming', 'uber_services'].includes(normalized);
  }, [service]);

  const isDuneBaseConstruction = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'dune_base_construction';
  }, [service]);

  const isDuneLeveling = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return (normalized === 'powerleveling' || normalized === 'leveling') && service.game === 'Dune Awakening';
  }, [service]);

  const isDuneBundle = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return ['dune_starter_pack', 'dune_advanced_pack', 'dune_endgame_pack'].includes(normalized);
  }, [service]);

  const isDuneCraftVehicle = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'dune_craft_vehicle';
  }, [service]);

  const isCustomService = useCallback(() => {
    if (!service) return false;
    const normalized = normalizeServiceType(service.serviceType);
    return normalized === 'custom' || normalized === 'custom_service' || service.isCustom === true;
  }, [service]);

  const isVariablePriceService = useCallback(() => {
    if (!service) return false;
    return service.priceType === 'variable' || service.priceType === 'negotiable';
  }, [service]);

  const hasPriceOptions = useCallback(() => {
    if (!service) return false;
    return service.priceOptions && service.priceOptions.length > 0;
  }, [service]);

  const getAvailableBuildsForLeveling = useCallback(() => {
    if (!service) return null;
    const game = service.game;

    if (game === 'Diablo 4' && isParagonLeveling()) {
      return { 
        builds: DIABLO_4_BUILDS, 
        tiers: ['starter', 'ancestral', 'mythic', 'tormented'], 
        prices: { starter: 30, ancestral: 50, mythic: 150, tormented: 200 } 
      };
    }

    if (game === 'Diablo 4' && isPowerleveling()) {
      return { 
        builds: DIABLO_4_BUILDS, 
        tiers: ['starter'], 
        prices: { starter: 30 } 
      };
    }

    if (game === 'Path of Exile 2') {
      return { 
        builds: POE2_BUILDS, 
        tiers: ['starter', 'advanced', 'endgame'], 
        prices: { starter: 40, advanced: 65, endgame: 85 } 
      };
    }

    return null;
  }, [service, isPowerleveling, isParagonLeveling]);

  // ========== EFFECTS ==========
  useEffect(() => {
    if (baseSizes.length > 0 && !selectedDuneBaseSize) {
      setSelectedDuneBaseSize(baseSizes[0].key);
    }
  }, [baseSizes, selectedDuneBaseSize]);

  useEffect(() => {
    if (availableVehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(availableVehicles[0].key);
    }
  }, [availableVehicles, selectedVehicle]);

  useEffect(() => {
    if (selectedVehicleConfig?.mkOptions?.length > 0) {
      setSelectedMKKey(selectedVehicleConfig.mkOptions[0].key);
    }
  }, [selectedVehicle, selectedVehicleConfig]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, quantity: runQuantity }));
  }, [runQuantity]);

  // Cálculo de precio
  const calculateTotalPrice = useCallback(() => {
    if (!service) return 0;

    const options = { 
      buildAddon: false, 
      buildPrice: 0, 
      buildName: '',
      selectedBoss,
      mode: serviceMode,
      includeMaterials,
      materialSets: includeMaterials ? materialSets : 0,
      bossConfig: selectedBossConfig
    };

    if (addBuildToLeveling) {
      const availableBuilds = getAvailableBuildsForLeveling();
      if (availableBuilds) {
        options.buildAddon = true;
        options.buildPrice = Number(availableBuilds.prices[selectedLevelingBuildTier]) || 0;
        if (service.game === 'Diablo 4') {
          options.buildName = DIABLO_4_BUILDS[`builds_${selectedLevelingBuildTier}`]?.name || 'Build';
        } else if (service.game === 'Path of Exile 2') {
          options.buildName = POE2_BUILDS[`poe2_build_${selectedLevelingBuildTier}`]?.name || 'Build';
        }
      }
    }

    const serviceDetails = {
      currentLevel: Number(formData.currentLevel) || 1,
      desiredLevel: Number(formData.desiredLevel) || 10,
      basePrice: Number(service.basePrice) || 0,
      quantity: isBossKillingD4() ? runQuantity : (Number(formData.quantity) || 1)
    };

    return calculatePriceFromPricing(service.serviceType, serviceDetails, service.game, options);
  }, [service, formData.currentLevel, formData.desiredLevel, formData.quantity, addBuildToLeveling, selectedLevelingBuildTier, getAvailableBuildsForLeveling, calculatePriceFromPricing, isBossKillingD4, selectedBoss, runQuantity, serviceMode, includeMaterials, materialSets, selectedBossConfig]);

  // Efecto principal de actualización de precio
  useEffect(() => {
    if (!service) return;

    let newPrice = 0;

    if (isBossKillingD4()) {
      const options = {
        selectedBoss,
        mode: serviceMode,
        includeMaterials,
        materialSets: includeMaterials ? materialSets : 0,
        bossConfig: selectedBossConfig
      };
      const serviceDetails = {
        currentLevel: 1,
        desiredLevel: 10,
        basePrice: selectedBossConfig?.basePrice || 1.49,
        quantity: runQuantity
      };
      newPrice = calculatePriceFromPricing(service.serviceType, serviceDetails, service.game, options);
    } else if (isThePitArtificer()) {
      newPrice = calculatePitPrice(pitRuns, pitMode, pitTier);
    } else if (isDiablo4Build()) {
      const baseBuildKey = service.serviceType;
      const buildTiers = ['builds_starter', 'builds_ancestral', 'builds_mythic', 'builds_tormented'];
      const selectedTiers = buildTiers.filter(tier => selectedBuilds[tier]);
      const finalBuildKey = selectedTiers.length > 0 ? selectedTiers[selectedTiers.length - 1] : baseBuildKey;
      newPrice = Number(DIABLO_4_BUILDS[finalBuildKey]?.price) || 30;
    } else if (isPoE2Build()) {
      const baseBuildKey = service.serviceType;
      const buildTiers = ['poe2_build_starter', 'poe2_build_advanced', 'poe2_build_endgame'];
      const selectedTiers = buildTiers.filter(tier => selectedPoE2Builds[tier.replace('poe2_build_', '')]);
      const finalBuildKey = selectedTiers.length > 0 ? selectedTiers[selectedTiers.length - 1] : baseBuildKey;
      newPrice = Number(POE2_BUILDS[finalBuildKey]?.price) || 40;
    } else if (isWowTbcPack()) {
      newPrice = WOW_TBC_PACKS[service.serviceType]?.price || 349;
    } else if (isPoE2Bundle()) {
      newPrice = service.serviceType === 'poe2_starter_pack' ? 105 : 225;
    } else if (isDuneBundle()) {
      if (service.serviceType === 'dune_starter_pack') newPrice = 45;
      else if (service.serviceType === 'dune_advanced_pack') newPrice = 99;
      else if (service.serviceType === 'dune_endgame_pack') newPrice = 199;
    } else if (isDuneBaseConstruction()) {
      const basePrice = selectedBaseConfig?.price || service.basePrice || 20;
      newPrice = basePrice;
      if (addDefenses) newPrice += 35;
      if (addAutomation) newPrice += 45;
      if (addResources) newPrice += 20;
      if (addClassUnlock) newPrice += 35;
    } else if (isDuneCraftVehicle()) {
      newPrice = selectedMK?.price || selectedVehicleConfig?.mkOptions?.[0]?.price || service.basePrice || 10;
    } else if (isOtherBuild()) {
      newPrice = Number(service.basePrice) || 35;
    } else if (isCustomService()) {
      if (isVariablePriceService()) {
        newPrice = Number(formData.customPrice) || Number(service.basePrice) || 0;
      } else {
        newPrice = Number(service.basePrice) || 0;
      }
    } else if (isMopRaid()) {
      const raidConfig = MOP_RAID_CONFIG[service.serviceType];
      const selectedOption = raidConfig?.options.find(o => o.value === mopRaidOption);
      let total = selectedOption?.price || raidConfig?.options[0]?.price || 0;
      
      if (mopPriorityLoot) total += raidConfig?.extras.priority?.price || 0;
      if (mopExtraItems) {
        total += raidConfig?.extras.items3?.price || 
                raidConfig?.extras.items5?.price || 
                raidConfig?.extras.items2?.price || 0;
      }
      newPrice = total;
      
      // Breakdown para MoP Raids
      const breakdown = [];
      breakdown.push({ item: `${raidConfig?.name} - ${selectedOption?.label}`, amount: selectedOption?.price || 0 });
      if (mopPriorityLoot && raidConfig?.extras.priority) {
        breakdown.push({ item: `➕ ${raidConfig.extras.priority.label}`, amount: raidConfig.extras.priority.price });
      }
      if (mopExtraItems) {
        const extraPrice = raidConfig?.extras.items3?.price || raidConfig?.extras.items5?.price || raidConfig?.extras.items2?.price || 0;
        const extraLabel = raidConfig?.extras.items3?.label || raidConfig?.extras.items5?.label || raidConfig?.extras.items2?.label || 'Extra Items';
        breakdown.push({ item: `➕ ${extraLabel}`, amount: extraPrice });
      }
      breakdown.push({ item: `🔒 Piloted (VPN Secured)`, amount: 0, note: 'Included' });
      breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
      setCurrentBreakdown(breakdown);
    } else {
      newPrice = calculateTotalPrice();
    }

    if (isNaN(newPrice) || newPrice === null || newPrice === undefined) {
      newPrice = 0;
    }

    setCurrentPrice(newPrice);

    // Actualizar breakdown para otros servicios
    if (!isMopRaid()) {
      if (isBossKillingD4()) {
        const options = {
          selectedBoss,
          mode: serviceMode,
          includeMaterials,
          materialSets: includeMaterials ? materialSets : 0,
          bossConfig: selectedBossConfig
        };
        const serviceDetails = {
          currentLevel: 1,
          desiredLevel: 10,
          basePrice: selectedBossConfig?.basePrice || 1.49,
          quantity: runQuantity
        };
        const breakdown = getPriceBreakdown(service.serviceType, serviceDetails, service.game, options);
        setCurrentBreakdown(breakdown);
      } else if (isThePitArtificer()) {
        const tierConfig = THE_PIT_TIER_OPTIONS.find(t => t.value === pitTier);
        const basePrice = tierConfig?.basePricePerRun || 1.99;
        const subtotal = basePrice * pitRuns;
        const breakdown = [{ item: `The Pit ${tierConfig?.label || ''} (${pitRuns} runs)`, amount: subtotal }];
        
        let discount = 0;
        if (pitRuns >= 50) discount = 0.15;
        else if (pitRuns >= 20) discount = 0.10;
        else if (pitRuns >= 10) discount = 0.05;
        if (discount > 0) {
          breakdown.push({ item: `Bulk Discount (${discount*100}%)`, amount: -subtotal * discount });
        }
        
        if (pitMode === 'piloted') {
          breakdown.push({ item: 'Piloted Mode', amount: pitRuns * 0.5 });
        }
        breakdown.push({ item: 'TOTAL', amount: newPrice, isTotal: true });
        setCurrentBreakdown(breakdown);
      } else if (isDuneBaseConstruction()) {
        const basePrice = selectedBaseConfig?.price || service.basePrice || 20;
        const breakdown = [{ item: `${selectedBaseConfig?.name || 'Base'}`, amount: basePrice }];
        if (addDefenses) breakdown.push({ item: 'Advanced Defense Systems', amount: 35 });
        if (addAutomation) breakdown.push({ item: 'Full Automation', amount: 45 });
        if (addResources) breakdown.push({ item: 'Starter Resource Pack', amount: 20 });
        if (addClassUnlock) breakdown.push({ item: 'Class Unlock', amount: 35 });
        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
        setCurrentBreakdown(breakdown);
      } else if (isDuneCraftVehicle()) {
        const basePrice = selectedMK?.price || selectedVehicleConfig?.mkOptions?.[0]?.price || service.basePrice || 10;
        const breakdown = [
          { item: `${selectedVehicleConfig?.name || 'Vehicle'} ${selectedMK?.name || ''}`, amount: basePrice }
        ];
        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
        setCurrentBreakdown(breakdown);
      } else if (isDuneBundle()) {
        const bundlePrice = service.serviceType === 'dune_starter_pack' ? 45 : 
                           service.serviceType === 'dune_advanced_pack' ? 99 : 199;
        setCurrentBreakdown([
          { item: formatServiceType(service.serviceType), amount: bundlePrice },
          { item: 'TOTAL', amount: bundlePrice, isTotal: true }
        ]);
      } else if (isCustomService()) {
        const finalPrice = isVariablePriceService() 
          ? (Number(formData.customPrice) || Number(service.basePrice) || 0)
          : (Number(service.basePrice) || 0);
        const breakdown = [
          { item: service.name || formatServiceType(service.serviceType), amount: finalPrice }
        ];
        if (formData.selectedOption) {
          breakdown.unshift({ item: `Option: ${formData.selectedOption}`, amount: finalPrice });
        }
        breakdown.push({ item: 'TOTAL', amount: finalPrice, isTotal: true });
        setCurrentBreakdown(breakdown);
      } else if (!isDiablo4Build() && !isPoE2Build() && !isWowTbcPack() && !isPoE2Bundle() && !isOtherBuild()) {
        const options = { buildAddon: false, buildPrice: 0, buildName: '' };
        if (addBuildToLeveling) {
          const availableBuilds = getAvailableBuildsForLeveling();
          if (availableBuilds) {
            options.buildAddon = true;
            options.buildPrice = Number(availableBuilds.prices[selectedLevelingBuildTier]) || 0;
            if (service.game === 'Diablo 4') {
              options.buildName = DIABLO_4_BUILDS[`builds_${selectedLevelingBuildTier}`]?.name || 'Build';
            } else if (service.game === 'Path of Exile 2') {
              options.buildName = POE2_BUILDS[`poe2_build_${selectedLevelingBuildTier}`]?.name || 'Build';
            }
          }
        }

        const serviceDetails = {
          currentLevel: Number(formData.currentLevel) || 1,
          desiredLevel: Number(formData.desiredLevel) || 10,
          basePrice: Number(service.basePrice) || 0,
          quantity: Number(formData.quantity) || 1
        };

        const breakdown = getPriceBreakdown(service.serviceType, serviceDetails, service.game, options);
        setCurrentBreakdown(breakdown);
      } else {
        setCurrentBreakdown([
          { item: formatServiceType(service.serviceType), amount: newPrice },
          { item: 'TOTAL', amount: newPrice, isTotal: true }
        ]);
      }
    }

  }, [service, selectedBuilds, selectedPoE2Builds, formData, addBuildToLeveling, selectedLevelingBuildTier, calculateTotalPrice, getPriceBreakdown, getAvailableBuildsForLeveling, isDiablo4Build, isPoE2Build, isWowTbcPack, isPoE2Bundle, isOtherBuild, isDuneBaseConstruction, isDuneBundle, isDuneCraftVehicle, isCustomService, isVariablePriceService, selectedDuneBaseSize, selectedBaseConfig, addDefenses, addAutomation, addResources, addClassUnlock, selectedVehicle, selectedMKKey, selectedMK, selectedVehicleConfig, isBossKillingD4, selectedBoss, runQuantity, serviceMode, includeMaterials, materialSets, selectedBossConfig, calculatePriceFromPricing, isThePitArtificer, pitTier, pitRuns, pitMode, isMopRaid, mopRaidOption, mopPriorityLoot, mopExtraItems]);

  // ========== FETCH SERVICE ==========
  const fetchService = useCallback(async () => {
    if (hasFetchedRef.current || !user || !serviceId) return;
    hasFetchedRef.current = true;

    try {
      const response = await axios.get(`/boosts/${serviceId}`);
      const serviceData = response.data;

      if (serviceData.basePrice !== undefined) {
        serviceData.basePrice = Number(serviceData.basePrice) || 0;
      }

      setService(serviceData);

      const maxLvl = getMaxLevel(serviceData.game, serviceData.serviceType);
      setMaxLevel(maxLvl || 100);
      setPricePerLevelState(getPricePerLevel(serviceData.game, serviceData.serviceType) || 0.17);

      if (serviceData.serviceType?.startsWith('builds_')) {
        const buildTiers = ['builds_starter', 'builds_ancestral', 'builds_mythic', 'builds_tormented'];
        const currentIndex = buildTiers.indexOf(serviceData.serviceType);
        const initialSelectedBuilds = {};
        buildTiers.forEach((tier, index) => { initialSelectedBuilds[tier] = index <= currentIndex; });
        setSelectedBuilds(initialSelectedBuilds);
      }

      if (serviceData.serviceType?.startsWith('mop_')) {
        const raidConfig = MOP_RAID_CONFIG[serviceData.serviceType];
        if (raidConfig?.options?.length > 0) {
          setMopRaidOption(raidConfig.options[0].value);
        }
        setMopPriorityLoot(false);
        setMopExtraItems(false);
      }

      if (serviceData.serviceType?.startsWith('poe2_build_')) {
        const buildTiers = ['poe2_build_starter', 'poe2_build_advanced', 'poe2_build_endgame'];
        const currentIndex = buildTiers.indexOf(serviceData.serviceType);
        const initialSelectedBuilds = {};
        buildTiers.forEach((tier, index) => { initialSelectedBuilds[tier.replace('poe2_build_', '')] = index <= currentIndex; });
        setSelectedPoE2Builds(initialSelectedBuilds);
      }

      if (serviceData.serviceType === 'boss_killing' && serviceData.game === 'Diablo 4') {
        setRunQuantity(50);
        setFormData(prev => ({ ...prev, quantity: 50 }));
      }

      if (serviceData.serviceType === 'the_pit_artificer' && serviceData.game === 'Diablo 4') {
        setPitRuns(10);
        setPitTier('tier3');
        setPitMode('self');
      }

      if (serviceData.serviceType === 'dune_base_construction' && serviceData.baseConfig?.availableSizes?.length > 0) {
        setSelectedDuneBaseSize(serviceData.baseConfig.availableSizes[0].key);
      }

      if (serviceData.serviceType === 'dune_craft_vehicle' && serviceData.vehicleConfig?.availableVehicles?.length > 0) {
        setSelectedVehicle(serviceData.vehicleConfig.availableVehicles[0].key);
      }

      const defaultDesired = Math.min(10, Math.floor((maxLvl || 100) / 10));
      setFormData(prev => ({ 
        ...prev, 
        currentLevel: 1, 
        desiredLevel: defaultDesired,
        customPrice: serviceData.basePrice || 0
      }));

    } catch (error) {
      console.error('Error:', error);
      alert('Error loading service');
    } finally {
      setLoading(false);
    }
  }, [serviceId, user, getMaxLevel, getPricePerLevel]);

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchService();
  }, [user, navigate, fetchService]);

  // ========== HANDLERS ==========
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'currentLevel' || name === 'desiredLevel' || name === 'quantity' || name === 'customPrice') {
      if (value === '') {
        setFormData(prev => ({ ...prev, [name]: '' }));
        return;
      }

      let processedValue = parseFloat(value, 10);
      if (isNaN(processedValue)) {
        processedValue = name === 'currentLevel' ? 1 : (name === 'desiredLevel' ? 10 : (name === 'customPrice' ? 0 : 1));
      }

      if (name === 'currentLevel' || name === 'desiredLevel') {
        processedValue = Math.max(1, Math.min(maxLevel, processedValue));

        if (name === 'currentLevel' && processedValue >= formData.desiredLevel) {
          setFormData(prev => ({ ...prev, currentLevel: processedValue, desiredLevel: Math.min(maxLevel, processedValue + 1) }));
          return;
        }
        if (name === 'desiredLevel' && processedValue <= formData.currentLevel) {
          setFormData(prev => ({ ...prev, currentLevel: Math.max(1, processedValue - 1), desiredLevel: processedValue }));
          return;
        }
      }

      if (name === 'customPrice') {
        processedValue = Math.max(0, processedValue);
      }

      setFormData(prev => ({ ...prev, [name]: processedValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ((isDuneBaseConstruction() || isDuneCraftVehicle()) && !buildSpecifications.trim()) {
      alert('Please provide special instructions / build specifications');
      return;
    }

    setSubmitting(true);
    try {
      let buildDetails = {};
      
      if (isMopRaid()) {
        const raidConfig = MOP_RAID_CONFIG[service.serviceType];
        const selectedOption = raidConfig.options.find(o => o.value === mopRaidOption);
        const extraItemsLabel = raidConfig.extras.items3?.label || 
                                raidConfig.extras.items5?.label || 
                                raidConfig.extras.items2?.label || 'Extra Items';
        const extraItemsPrice = raidConfig.extras.items3?.price || 
                                raidConfig.extras.items5?.price || 
                                raidConfig.extras.items2?.price || 0;
        
        buildDetails = {
          ...buildDetails,
          raid: raidConfig.name,
          raidKey: service.serviceType,
          difficulty: selectedOption?.label,
          difficultyKey: mopRaidOption,
          basePrice: selectedOption?.price || 0,
          priorityLoot: mopPriorityLoot,
          priorityLootPrice: mopPriorityLoot ? raidConfig.extras.priority?.price || 0 : 0,
          extraItems: mopExtraItems,
          extraItemsLabel: mopExtraItems ? extraItemsLabel : null,
          extraItemsPrice: mopExtraItems ? extraItemsPrice : 0,
          method: 'piloted',
          estimatedTime: raidConfig.estimatedTime,
          bossCount: raidConfig.bosses,
          buildSpecifications
        };
      }

      if (isBossKillingD4()) {
        buildDetails = {
          boss: selectedBoss,
          bossName: selectedBossConfig?.label,
          runs: runQuantity,
          serviceMode: serviceMode,
          includeMaterials: includeMaterials,
          materialSets: includeMaterials ? materialSets : 0,
          materialName: selectedBossConfig?.materialName,
          materialPrice: selectedBossConfig?.materialPrice,
          discount: selectedQuantityConfig?.discount || 0,
          buildSpecifications
        };
      }

      if (isThePitArtificer()) {
        const tierConfig = THE_PIT_TIER_OPTIONS.find(t => t.value === pitTier);
        buildDetails = {
          ...buildDetails,
          pitTier: pitTier,
          pitTierName: tierConfig?.label,
          runs: pitRuns,
          serviceMode: pitMode,
          buildSpecifications
        };
      }

      if (isDiablo4Build()) {
        const buildTiers = ['builds_starter', 'builds_ancestral', 'builds_mythic', 'builds_tormented'];
        const selectedTiers = buildTiers.filter(tier => selectedBuilds[tier]);
        const finalBuildKey = selectedTiers.length > 0 ? selectedTiers[selectedTiers.length - 1] : service.serviceType;
        buildDetails = {
          ...buildDetails,
          buildType: service.serviceType,
          selectedUpgrades: selectedTiers.filter(t => t !== service.serviceType).map(t => DIABLO_4_BUILDS[t]?.name || t),
          finalBuild: DIABLO_4_BUILDS[finalBuildKey]?.name || 'Build',
          buildSpecifications
        };
      }

      if (isPoE2Build()) {
        const buildTiers = ['poe2_build_starter', 'poe2_build_advanced', 'poe2_build_endgame'];
        const selectedTiers = buildTiers.filter(tier => selectedPoE2Builds[tier.replace('poe2_build_', '')]);
        const finalBuildKey = selectedTiers.length > 0 ? selectedTiers[selectedTiers.length - 1] : service.serviceType;
        buildDetails = {
          ...buildDetails,
          buildType: service.serviceType,
          selectedUpgrades: selectedTiers.filter(t => t !== service.serviceType).map(t => POE2_BUILDS[t]?.name || t),
          finalBuild: POE2_BUILDS[finalBuildKey]?.name || 'Build',
          buildSpecifications
        };
      }

      if ((isPowerleveling() || isParagonLeveling()) && addBuildToLeveling) {
        const availableBuilds = getAvailableBuildsForLeveling();
        if (availableBuilds) {
          const buildKey = service.game === 'Diablo 4' ? `builds_${selectedLevelingBuildTier}` : `poe2_build_${selectedLevelingBuildTier}`;
          buildDetails = {
            ...buildDetails,
            buildAddon: true,
            buildTier: selectedLevelingBuildTier,
            buildName: availableBuilds.builds[buildKey]?.name || 'Build',
            buildPrice: availableBuilds.prices[selectedLevelingBuildTier] || 0,
            buildSpecifications
          };
        }
      }

      if (isDuneBaseConstruction()) {
        buildDetails = {
          ...buildDetails,
          baseSize: selectedDuneBaseSize,
          baseName: selectedBaseConfig?.name,
          basePrice: selectedBaseConfig?.price || service.basePrice,
          addDefenses,
          addAutomation,
          addResources,
          addClassUnlock,
          selectedClass: selectedDuneClass,
          buildSpecifications
        };
      }

      if (isDuneCraftVehicle()) {
        buildDetails = {
          ...buildDetails,
          vehicleType: selectedVehicle,
          vehicleName: selectedVehicleConfig?.name,
          mkVersion: selectedMKKey,
          mkName: selectedMK?.name,
          vehiclePrice: selectedMK?.price || service.basePrice,
          buildSpecifications
        };
      }

      if (isCustomService()) {
        buildDetails = {
          ...buildDetails,
          customPrice: formData.customPrice,
          selectedOption: formData.selectedOption,
          buildSpecifications
        };
      }

      const orderData = {
        service: serviceId,
        gameDetails: { 
          game: service.game, 
          serviceType: service.serviceType, 
          ...formData,
          ...buildDetails,
          customerNotes: formData.notes 
        },
        totalPrice: Number(currentPrice),
        priceBreakdown: currentBreakdown
      };
      
      const response = await axios.post('/orders', orderData);
      navigate(`/checkout/${response.data.order._id}`);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ========== RENDER SERVICE FIELDS ==========
  const renderServiceFields = () => {
    if (!service) return null;
    
    const commonProps = {
      service,
      buildSpecifications,
      setBuildSpecifications,
      currentPrice
    };

    if (isBossKillingD4()) {
      return (
        <Diablo4BossOptions
          {...commonProps}
          selectedBoss={selectedBoss}
          setSelectedBoss={setSelectedBoss}
          runQuantity={runQuantity}
          setRunQuantity={setRunQuantity}
          serviceMode={serviceMode}
          setServiceMode={setServiceMode}
          includeMaterials={includeMaterials}
          setIncludeMaterials={setIncludeMaterials}
          materialSets={materialSets}
          setMaterialSets={setMaterialSets}
          selectedBossConfig={selectedBossConfig}
          selectedQuantityConfig={selectedQuantityConfig}
        />
      );
    }

    if (isThePitArtificer()) {
      return (
        <ThePitArtificerOptions
          {...commonProps}
          pitTier={pitTier}
          setPitTier={setPitTier}
          pitRuns={pitRuns}
          setPitRuns={setPitRuns}
          pitMode={pitMode}
          setPitMode={setPitMode}
        />
      );
    }

    if (isMopRaid()) {
      return (
        <MopRaidOptions
          {...commonProps}
          mopRaidOption={mopRaidOption}
          setMopRaidOption={setMopRaidOption}
          mopPriorityLoot={mopPriorityLoot}
          setMopPriorityLoot={setMopPriorityLoot}
          mopExtraItems={mopExtraItems}
          setMopExtraItems={setMopExtraItems}
        />
      );
    }

    if (isDuneBaseConstruction()) {
      return (
        <DuneBaseOptions
          {...commonProps}
          selectedDuneBaseSize={selectedDuneBaseSize}
          setSelectedDuneBaseSize={setSelectedDuneBaseSize}
          addDefenses={addDefenses}
          setAddDefenses={setAddDefenses}
          addAutomation={addAutomation}
          setAddAutomation={setAddAutomation}
          addResources={addResources}
          setAddResources={setAddResources}
          addClassUnlock={addClassUnlock}
          setAddClassUnlock={setAddClassUnlock}
          selectedDuneClass={selectedDuneClass}
          setSelectedDuneClass={setSelectedDuneClass}
          baseSizes={baseSizes}
          availableAddons={availableAddons}
          selectedBaseConfig={selectedBaseConfig}
        />
      );
    }

    if (isDuneCraftVehicle()) {
      return (
        <DuneCraftVehicleOptions
          {...commonProps}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          selectedMKKey={selectedMKKey}
          setSelectedMKKey={setSelectedMKKey}
          availableVehicles={availableVehicles}
          selectedVehicleConfig={selectedVehicleConfig}
          selectedMK={selectedMK}
          vehicleConfig={vehicleConfig}
        />
      );
    }

    if (isDuneLeveling()) {
      return (
        <DuneLevelingOptions
          {...commonProps}
          formData={formData}
          handleChange={handleChange}
          addClassUnlock={addClassUnlock}
          setAddClassUnlock={setAddClassUnlock}
          maxLevel={maxLevel}
        />
      );
    }

    if (isDuneBundle()) {
      return <DuneBundleOptions {...commonProps} />;
    }

    if (isWowTbcPack()) {
      return (
        <TbcPackOptions
          {...commonProps}
          formData={formData}
          handleChange={handleChange}
        />
      );
    }

    if (isDiablo4Build()) {
      return (
        <Diablo4BuildOptions
          {...commonProps}
          selectedBuilds={selectedBuilds}
          setSelectedBuilds={setSelectedBuilds}
        />
      );
    }

    if (isPoE2Build()) {
      return (
        <PoE2BuildOptions
          {...commonProps}
          selectedPoE2Builds={selectedPoE2Builds}
          setSelectedPoE2Builds={setSelectedPoE2Builds}
        />
      );
    }

    if (isPoE2Bundle()) {
      return <PoE2BundleOptions {...commonProps} />;
    }

    if (isOtherBuild()) {
      return <OtherBuildOptions {...commonProps} />;
    }

    if (isCustomService()) {
      return (
        <CustomServiceOptions
          {...commonProps}
          formData={formData}
          handleChange={handleChange}
          isVariablePriceService={isVariablePriceService}
          hasPriceOptions={hasPriceOptions}
        />
      );
    }

    if (isPowerleveling()) {
      return (
        <PowerlevelingOptions
          {...commonProps}
          formData={formData}
          handleChange={handleChange}
          setFormData={setFormData}
          maxLevel={maxLevel}
          addBuildToLeveling={addBuildToLeveling}
          setAddBuildToLeveling={setAddBuildToLeveling}
          selectedLevelingBuildTier={selectedLevelingBuildTier}
          setSelectedLevelingBuildTier={setSelectedLevelingBuildTier}
          getAvailableBuildsForLeveling={getAvailableBuildsForLeveling}
        />
      );
    }

    if (isParagonLeveling()) {
      return (
        <ParagonLevelingOptions
          {...commonProps}
          formData={formData}
          handleChange={handleChange}
          setFormData={setFormData}
          maxLevel={maxLevel}
          addBuildToLeveling={addBuildToLeveling}
          setAddBuildToLeveling={setAddBuildToLeveling}
          selectedLevelingBuildTier={selectedLevelingBuildTier}
          setSelectedLevelingBuildTier={setSelectedLevelingBuildTier}
          getAvailableBuildsForLeveling={getAvailableBuildsForLeveling}
        />
      );
    }

    if (isLeveling()) {
      return (
        <LevelingOptions
          {...commonProps}
          formData={formData}
          handleChange={handleChange}
          setFormData={setFormData}
          maxLevel={maxLevel}
        />
      );
    }

    if (supportsQuantity()) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-blue-200 shadow-lg">
          <h3 className="text-xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-2 text-2xl">🔢</span> Service Configuration
          </h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Quantity</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                name="quantity" 
                value={formData.quantity} 
                onChange={handleChange} 
                min="1" 
                max="50" 
                className="w-full h-2 bg-blue-200 rounded-lg accent-blue-600" 
              />
              <span className="text-2xl font-bold text-blue-600 min-w-12 text-center">
                {formData.quantity}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3">{formData.quantity} units selected</p>
          </div>
        </div>
      );
    }

    // Default render
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-blue-200 shadow-lg">
        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
          <span className="mr-2 text-2xl">📋</span> Service Details
        </h3>
        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100">
          {service.description ? (
            <p className="text-gray-700 text-base leading-relaxed">{service.description}</p>
          ) : (
            <p className="text-gray-500 italic">No description available.</p>
          )}
        </div>
        {service.features && service.features.length > 0 && (
          <div className="mt-5">
            <h4 className="font-semibold text-gray-800 mb-3">What's Included:</h4>
            <ul className="space-y-2">
              {service.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 mt-1 flex-shrink-0">✓</span>
                  <span>{typeof feature === 'string' ? feature : feature.name || feature.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 p-4 bg-blue-100 rounded-xl border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-800 font-bold">Fixed Price:</span>
            <span className="text-3xl font-black text-blue-700">
              ${formatPrice(currentPrice)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ========== LOADING & ERROR STATES ==========
  if (loading) {
    return (
      <>
        <CustomNavbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your service...</p>
          </div>
        </div>
      </>
    );
  }

  if (!service) {
    return (
      <>
        <CustomNavbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
            <button 
              onClick={() => navigate('/services')} 
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Browse Services
            </button>
          </div>
        </div>
      </>
    );
  }

  // ========== MAIN RENDER ==========
  const packConfig = isWowTbcPack() ? WOW_TBC_PACKS[service.serviceType] : null;
  const bundleConfig = isPoE2Bundle() || isDuneBundle() ? BUILD_DESCRIPTIONS[service.serviceType] : null;

  const getServiceIcon = () => {
    if (isBossKillingD4()) return '👹';
    if (isThePitArtificer()) return '🔮';
    if (isMopRaid()) return MOP_RAID_CONFIG[service.serviceType]?.icon || '🐉';
    if (packConfig?.icon) return packConfig.icon;
    if (bundleConfig) {
      if (service.serviceType === 'poe2_starter_pack') return '🚀';
      if (service.serviceType === 'dune_starter_pack') return '🌅';
      if (service.serviceType === 'dune_advanced_pack') return '🏜️';
      return '🌌';
    }
    if (isDuneBaseConstruction()) return '🏗️';
    if (isDuneCraftVehicle()) return '🏍️';
    if (isCustomService()) return '🛠️';
    return '🎮';
  };

  return (
    <>
      <CustomNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">

          <div className="mb-4">
            <button 
              onClick={() => navigate(-1)} 
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm transition-colors"
            >
              <span>←</span> Back to Services
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{getServiceIcon()}</span>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                {service.name || formatServiceType(service.serviceType)}
              </h1>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <p className="text-gray-600">{service.game}</p>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {isCustomService() 
                  ? (service.priceType?.charAt(0).toUpperCase() + service.priceType?.slice(1) || 'Custom')
                  : formatServiceType(service.serviceType)
                }
              </span>
            </div>
            {service.description && 
             !isPoE2Bundle() && 
             !isDuneBundle() && 
             !isCustomService() && 
             !isBossKillingD4() && 
             !isThePitArtificer() && (
              <div className="mt-3 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-700 text-base leading-relaxed">{service.description}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {renderServiceFields()}
            </div>

            <div className="lg:col-span-1">
              <ServiceSummary
                service={service}
                currentPrice={currentPrice}
                currentBreakdown={currentBreakdown}
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                submitting={submitting}
                isMopRaid={isMopRaid}
                isBossKillingD4={isBossKillingD4}
                isThePitArtificer={isThePitArtificer}
                isWowTbcPack={isWowTbcPack}
                isLeveling={isLeveling}
                isPowerleveling={isPowerleveling}
                isParagonLeveling={isParagonLeveling}
                isDuneLeveling={isDuneLeveling}
                isDuneBaseConstruction={isDuneBaseConstruction}
                isDuneCraftVehicle={isDuneCraftVehicle}
                isCustomService={isCustomService}
                isVariablePriceService={isVariablePriceService}
                supportsQuantity={supportsQuantity}
                mopRaidOption={mopRaidOption}
                mopPriorityLoot={mopPriorityLoot}
                mopExtraItems={mopExtraItems}
                selectedBossConfig={selectedBossConfig}
                runQuantity={runQuantity}
                serviceMode={serviceMode}
                includeMaterials={includeMaterials}
                materialSets={materialSets}
                materialName={selectedBossConfig?.materialName}
                selectedQuantityConfig={selectedQuantityConfig}
                pitTier={pitTier}
                pitRuns={pitRuns}
                pitMode={pitMode}
                packConfig={packConfig}
                addBuildToLeveling={addBuildToLeveling}
                selectedLevelingBuildTier={selectedLevelingBuildTier}
                addClassUnlock={addClassUnlock}
                selectedBaseConfig={selectedBaseConfig}
                addDefenses={addDefenses}
                addAutomation={addAutomation}
                addResources={addResources}
                selectedVehicleConfig={selectedVehicleConfig}
                selectedMK={selectedMK}
                THE_PIT_TIER_OPTIONS={THE_PIT_TIER_OPTIONS}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Order;
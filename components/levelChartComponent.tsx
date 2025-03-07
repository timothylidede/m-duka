import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface RevenueInfoGraphicsProps {
    allTimeRevenue: number;
    visible: boolean;
    onClose: () => void;
}

interface LevelInfo {
    currentLevel: number;
    nextTarget: number;
    progress: number;
}

const RevenueInfoGraphics: React.FC<RevenueInfoGraphicsProps> = ({ allTimeRevenue, visible, onClose }) => {
  const [activeLevel, setActiveLevel] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  
  // Define levelColors with explicit type as an array of two-string tuples
  const levelColors: [string, string][] = [
    ["#4C60F5", "#6FD0FC"],
    ["#33BBCF", "#4FEEFD"],
    ["#5E35B1", "#9575CD"],
    ["#00C853", "#69F0AE"],
    ["#FF6D00", "#FFAB40"],
    ["#D500F9", "#E040FB"]
  ];
  
  // Define defaultColors with explicit type as a two-string tuple
  const defaultColors: [string, string] = ['#F1F5F9', '#F8FAFC'];
  
  const targets = [10000, 50000, 100000, 250000, 500000, 1000000];
  const levelNames = [
    "Starting Business",
    "Emerging Venture",
    "Established Business",
    "Growth Business",
    "Scaling Enterprise",
    "Market Leader"
  ];
  
  const levelDescriptions = [
    "You're just getting started! Focus on building your customer base and refining your product offerings.",
    "Your business is gaining traction. Consider expanding your inventory and optimizing your operations.",
    "You've established a solid foundation. Now's the time to invest in marketing and customer retention.",
    "Your business is growing steadily. Consider expanding to new locations or adding complementary products.",
    "You're scaling successfully. Focus on operational efficiency and building a strong management team.",
    "Congratulations! You've reached market leader status. Focus on innovation and maintaining your competitive edge."
  ];
  
  const getLevelInfo = (revenue: number): LevelInfo => {
    let currentLevel = 0;
    let nextTarget = targets[0];
    let progress = 0;

    for (let i = 0; i < targets.length; i++) {
        if (revenue < targets[i]) {
            nextTarget = targets[i];
            progress = i === 0
                ? (revenue / targets[0]) * 100
                : ((revenue - targets[i - 1]) / (targets[i] - targets[i - 1])) * 100;
            break;
        }
        currentLevel = i + 1;
    }

    if (currentLevel === targets.length) {
        progress = 100; // Max level achieved
    }

    return { currentLevel, nextTarget, progress };
  };
  
  // Get current level info
  const levelInfo = getLevelInfo(allTimeRevenue);
  
  useEffect(() => {
    // Set active level to current level when modal opens
    if (visible) {
      setActiveLevel(levelInfo.currentLevel);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible, levelInfo.currentLevel]);

  const selectLevel = (level: number): void => {
    setActiveLevel(level);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderLevelMarkers = () => {
    return (
      <View style={styles.levelMarkersContainer}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(Math.min(levelInfo.currentLevel, targets.length - 1) * 100) / (targets.length - 1) + (levelInfo.currentLevel < targets.length ? levelInfo.progress / (targets.length - 1) : 0)}%` }
              ]} 
            />
          </View>
          
          {targets.map((target, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => selectLevel(index)}
              style={[
                styles.levelMarker, 
                { 
                  backgroundColor: index <= levelInfo.currentLevel ? levelColors[index][0] : '#E2E8F0',
                  left: `${(index * 100) / (targets.length - 1)}%`,
                  transform: [{ translateX: -15 }]
                }
              ]}
            >
              <Text style={[
                styles.levelNumber, 
                { color: index <= levelInfo.currentLevel ? 'white' : '#64748B' }
              ]}>
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.levelLabelsContainer}>
          {targets.map((target, index) => (
            <Text 
              key={index} 
              style={[
                styles.levelLabel,
                { 
                  left: `${(index * 100) / (targets.length - 1)}%`,
                  transform: [{ translateX: -30 }],
                  color: index <= levelInfo.currentLevel ? '#1E293B' : '#94A3B8'
                }
              ]}
            >
              {index === 0 ? 'KES 10K' : index === 1 ? 'KES 50K' : `KES ${target / 1000}K`}
            </Text>
          ))}
        </View>
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Revenue Level Insights</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <View style={styles.currentStatusContainer}>
              <Text style={styles.currentStatusTitle}>
                Current Status: Level {levelInfo.currentLevel + 1}
              </Text>
              <Text style={styles.currentStatusValue}>
                KES {allTimeRevenue.toLocaleString()}
              </Text>
              
              {levelInfo.currentLevel < targets.length - 1 && (
                <Text style={styles.nextLevelText}>
                  KES {(targets[levelInfo.currentLevel] - allTimeRevenue).toLocaleString()} more to reach Level {levelInfo.currentLevel + 2}
                </Text>
              )}
            </View>
            
            {renderLevelMarkers()}
            
            <LinearGradient
              colors={levelColors[activeLevel]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.levelDetailCard}
            >
              <View style={styles.levelDetailHeader}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{activeLevel + 1}</Text>
                </View>
                <Text style={styles.levelDetailTitle}>{levelNames[activeLevel]}</Text>
              </View>
              
              <Text style={styles.levelDetailDescription}>
                {levelDescriptions[activeLevel]}
              </Text>
              
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Revenue Target:</Text>
                <Text style={styles.targetValue}>
                  KES {activeLevel === 0 ? "0 - 10,000" : 
                      activeLevel === targets.length - 1 ? `${targets[activeLevel - 1].toLocaleString()} +` : 
                      `${targets[activeLevel - 1].toLocaleString()} - ${targets[activeLevel].toLocaleString()}`}
                </Text>
              </View>
              
              {activeLevel === levelInfo.currentLevel && (
                <View style={styles.currentProgressSection}>
                  <Text style={styles.currentProgressLabel}>Your Progress:</Text>
                  <View style={styles.miniProgressBar}>
                    <View style={[styles.miniProgressFill, { width: `${levelInfo.progress}%` }]} />
                  </View>
                  <Text style={styles.progressPercentage}>{levelInfo.progress.toFixed(1)}%</Text>
                </View>
              )}
            </LinearGradient>
            
            <View style={styles.levelSelectionContainer}>
              <Text style={styles.levelSelectionTitle}>Explore Levels</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelSelectionScroll}>
                {targets.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => selectLevel(index)}
                    style={[
                      styles.levelSelectionItem,
                      activeLevel === index && { borderColor: levelColors[index][0] }
                    ]}
                  >
                    <LinearGradient
                      colors={activeLevel === index ? levelColors[index] : defaultColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.levelSelectionGradient}
                    >
                      <Text style={[
                        styles.levelSelectionNumber,
                        { color: activeLevel === index ? 'white' : '#64748B' }
                      ]}>
                        {index + 1}
                      </Text>
                    </LinearGradient>
                    <Text style={[
                      styles.levelSelectionLabel,
                      { color: activeLevel === index ? levelColors[index][0] : '#64748B' }
                    ]}>
                      Level {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.tipContainer}>
              <View style={styles.tipHeader}>
                <Feather name="info" size={20} color="#2E3192" />
                <Text style={styles.tipTitle}>Business Insight</Text>
              </View>
              <Text style={styles.tipText}>
                {activeLevel === levelInfo.currentLevel ? 
                  `At your current level, focus on ${levelInfo.currentLevel === 0 ? 'customer acquisition' : 
                    levelInfo.currentLevel === 1 ? 'product diversification' : 
                    levelInfo.currentLevel === 2 ? 'operational efficiency' : 
                    levelInfo.currentLevel === 3 ? 'market expansion' : 
                    levelInfo.currentLevel === 4 ? 'scaling systems' : 'market dominance'}.` :
                  `Level ${activeLevel + 1} businesses typically have ${activeLevel === 0 ? 'fewer than 50' : 
                    activeLevel === 1 ? '50-100' : 
                    activeLevel === 2 ? '100-200' : 
                    activeLevel === 3 ? '200-500' : 
                    activeLevel === 4 ? '500-1000' : '1000+'} transactions per month.`
                }
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStatusContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentStatusTitle: {
    fontSize: 14,
    color: '#64748B',
  },
  currentStatusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E3192',
    marginTop: 4,
  },
  nextLevelText: {
    fontSize: 14,
    color: '#2E3192',
    marginTop: 8,
  },
  levelMarkersContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 30,
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E3192',
    borderRadius: 3,
  },
  levelMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 1,
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  levelLabelsContainer: {
    flexDirection: 'row',
    position: 'relative',
    height: 20,
  },
  levelLabel: {
    position: 'absolute',
    fontSize: 12,
    color: '#94A3B8',
  },
  levelDetailCard: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  levelDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  levelDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  levelDetailDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 16,
  },
  targetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  currentProgressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  currentProgressLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 8,
  },
  miniProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: 'white',
    alignSelf: 'flex-end',
  },
  levelSelectionContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  levelSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  levelSelectionScroll: {
    flexDirection: 'row',
  },
  levelSelectionItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 6,
  },
  levelSelectionGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  levelSelectionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelSelectionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tipContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2E3192',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3192',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});

export default RevenueInfoGraphics;
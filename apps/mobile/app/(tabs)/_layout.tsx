import { Tabs } from 'expo-router';
import { Home, Clock, FileText, CheckSquare, Briefcase } from 'lucide-react-native';

import { cores } from '@/lib/theme';

export default function LayoutTabs() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: cores.navy[900],
          borderBottomWidth: 2,
          borderBottomColor: cores.gold[500],
        },
        headerTintColor: cores.cream,
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: cores.gold[500],
        tabBarInactiveTintColor: cores.gray[500],
        tabBarStyle: {
          backgroundColor: cores.navy[900],
          borderTopWidth: 1,
          borderTopColor: cores.navy[700],
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="ponto"
        options={{
          title: 'Ponto',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="relatorio"
        options={{
          title: 'Relatorio',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="demandas"
        options={{
          title: 'Demandas',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  );
}

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WelcomeHeader } from '@/components/dashboard/widgets/WelcomeHeader';
import { TodayTasks } from '@/components/dashboard/widgets/TodayTasks';
import { MyExams } from '@/components/dashboard/widgets/MyExams';
import { MyClassrooms } from '@/components/dashboard/widgets/MyClassrooms';
import { AIFocusSession } from '@/components/dashboard/widgets/AIFocusSession';
import { MoodCheckin } from '@/components/dashboard/widgets/MoodCheckin';
import { WeakSubjects } from '@/components/dashboard/widgets/WeakSubjects';
import { CareerInsight } from '@/components/dashboard/widgets/CareerInsight';
import { LifeSkillCard } from '@/components/dashboard/widgets/LifeSkillCard';
import { api } from '@/lib/api';

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };

export default function Dashboard() {
  useQuery({ queryKey: ['focus-stats'], queryFn: async () => (await api.get('/focus/stats')).data });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <WelcomeHeader />
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-12 gap-4 mt-5">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <motion.div variants={fade}><TodayTasks /></motion.div>
            <motion.div variants={fade} className="grid md:grid-cols-2 gap-4">
              <MyExams />
              <WeakSubjects />
            </motion.div>
            <motion.div variants={fade}><MyClassrooms /></motion.div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <motion.div variants={fade}><AIFocusSession /></motion.div>
            <motion.div variants={fade}><MoodCheckin /></motion.div>
            <motion.div variants={fade}><CareerInsight /></motion.div>
            <motion.div variants={fade}><LifeSkillCard /></motion.div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

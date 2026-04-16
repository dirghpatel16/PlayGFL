import { scoringConfig } from "@/lib/config/season";

export default function RulesPage() {
  return (
    <div className="py-8 space-y-4">
      <h1 className="section-title">Rules & Scoring</h1>
      <section className="card p-5 text-sm text-white/80 space-y-2">
        <p>Normal rounds: 1st {scoringConfig.normalRounds.placement.first}, 2nd {scoringConfig.normalRounds.placement.second}, 3rd {scoringConfig.normalRounds.placement.third}.</p>
        <p>Bonus: back-to-back +{scoringConfig.bonuses.backToBackChicken}, three back-to-back +{scoringConfig.bonuses.threepeatChicken}.</p>
        <p>Golden rounds on {scoringConfig.goldenRounds.map}: 1st {scoringConfig.goldenRounds.placement.first}, 2nd {scoringConfig.goldenRounds.placement.second}, 3rd {scoringConfig.goldenRounds.placement.third}, kills +{scoringConfig.goldenRounds.killPoint}, nominated player x{scoringConfig.goldenRounds.nominatedMultiplier}.</p>
      </section>
    </div>
  );
}

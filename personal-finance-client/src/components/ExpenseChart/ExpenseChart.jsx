import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './ExpenseChart.css';

// עכשיו הגרף מקבל את התנועות מהדשבורד!
const ExpenseChart = ({ transactions }) => {

    // 1. מסננים רק את התנועות שהן הוצאה ('expense')
    const expenses = transactions ? transactions.filter(tx => tx.type === 'expense') : [];

    // 2. מקבצים את ההוצאות לפי התיאור (מחברים סכומים של תיאורים זהים)
    const groupedData = expenses.reduce((acc, tx) => {
        const amount = parseFloat(tx.amount);
        if (acc[tx.description]) {
            acc[tx.description] += amount;
        } else {
            acc[tx.description] = amount;
        }
        return acc;
    }, {});

    // 3. ממירים את האובייקט למערך שהגרף יודע לקרוא, וממיינים מהגדול לקטן
    let data = Object.keys(groupedData).map(key => ({
        name: key,
        value: groupedData[key]
    })).sort((a, b) => b.value - a.value);

    // 4. אם יש יותר מ-4 סוגי הוצאות, ניקח את ה-3 הגדולים ונאחד את השאר ל"אחר" כדי לשמור על עיצוב נקי
    if (data.length > 4) {
        const topThree = data.slice(0, 3);
        const others = data.slice(3).reduce((sum, item) => sum + item.value, 0);
        data = [...topThree, { name: 'אחר / שונות', value: others }];
    }

    // צבעי הסייבר שלנו
    const COLORS = ['#00f3ff', '#ff3366', '#00ff88', '#a855f7', '#facc15'];

    // עיצוב החלונית שקופצת כשעוברים עם העכבר על הגרף
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="cyber-tooltip">
                    <p className="label">{`${payload[0].name}`}</p>
                    <p className="value">₪{payload[0].value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-container">
            <h3>פילוח הוצאות</h3>

            {data.length === 0 ? (
                // מה קורה כשאין עדיין הוצאות
                <div style={{ color: '#8892b0', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    אין נתוני הוצאות להצגה.
                </div>
            ) : (
                <>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            style={{ filter: `drop-shadow(0px 0px 8px ${COLORS[index % COLORS.length]}80)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* מקרא הצבעים מתחת לגרף */}
                    <div className="chart-legend">
                        {data.map((entry, index) => (
                            <div key={`legend-${index}`} className="legend-item">
                                <span className="dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span className="legend-name">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ExpenseChart;
# Curva de Aprendizado - Retornos Decrescentes

set terminal pngcairo size 800,500 enhanced font 'Arial,12' background rgb '#f8fafc'
set output '/home/david/Documentos/Pessoal/Projetos/study-html-css/frontend/public/blog/curva-aprendizado.png'

# Estilo
set border 3 lw 2 lc rgb '#334155'
set tics nomirror

# Labels
set xlabel "Horas de Dedicação" font 'Arial,14' tc rgb '#334155'
set ylabel "Desempenho (%)" font 'Arial,14' tc rgb '#334155'

# Ranges
set xrange [0:350]
set yrange [0:100]

# Tics
set xtics ("0" 0, "50h" 50, "100h" 100, "200h" 200, "300h" 300) tc rgb '#64748b'
set ytics ("0%%" 0, "50%%" 50, "70%%" 70, "85%%" 85, "95%%" 95) tc rgb '#64748b'

# Grid
set grid ytics lt 0 lw 0.5 lc rgb '#e2e8f0'

# Curva logarítmica
f(x) = 95 * (1 - exp(-x/80))

# Zonas coloridas com objetos retangulares
set object 1 rect from 0,0 to 60,100 fc rgb '#22c55e' fs transparent solid 0.15 noborder
set object 2 rect from 60,0 to 180,100 fc rgb '#eab308' fs transparent solid 0.15 noborder
set object 3 rect from 180,0 to 350,100 fc rgb '#ef4444' fs transparent solid 0.15 noborder

# Labels das zonas
set label 1 "Conhecendo" at 30,8 center font 'Arial,11' tc rgb '#16a34a'
set label 2 "Aprofundando" at 120,8 center font 'Arial,11' tc rgb '#ca8a04'
set label 3 "Dominando" at 265,8 center font 'Arial,11' tc rgb '#dc2626'

# Plot (pontos inline: 50h=47%, 100h=71%, 300h=92%)
$data << EOD
50 47
100 71
300 92
EOD

plot f(x) with lines lw 3 lc rgb '#3b82f6' title 'Curva de Aprendizado', \
     $data using 1:2 with points pt 7 ps 1.5 lc rgb '#1e40af' notitle

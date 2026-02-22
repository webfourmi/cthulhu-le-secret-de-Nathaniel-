{
  "state": { "hp": 12, "time": 0, "inv": [], "flags": {} },

  "nodes": {
    "2": {
      "title": "Pièce 2",
      "text": "Un grand espace central. Le silence a la politesse d’un piège.",
      "actions": [
        { "label": "Inspecter", "result": "Tu repères une trace récente au sol.", "effects": { "flags.trace2": true, "time:+": 5 } },
        { "label": "Retour carte", "goto": "carte" }
      ]
    },
    "6": {
      "title": "Pièce 6",
      "requires": ["flags.trace2"],
      "lockedText": "La porte résiste. Sans indice, tu perds du temps ici.",
      "text": "Un couloir. L’air sent le métal et la poussière chauffée.",
      "actions": [
        { "label": "Avancer", "result": "Au bout, une grille. Elle n’aime pas ta présence.", "effects": { "time:+": 10 } },
        { "label": "Retour carte", "goto": "carte" }
      ]
    },
    "20": {
      "title": "Pièce 20",
      "text": "Une grande salle isolée. On dirait un endroit où les secrets font la sieste.",
      "actions": [
        { "label": "Fouiller", "result": "Tu trouves une clé (rouillée mais fière).", "effects": { "inv:+": "clé rouillée", "time:+": 10 } },
        { "label": "Retour carte", "goto": "carte" }
      ]
    }
  },

  "hotspots": [
    { "id": "2", "x": 36, "y": 26, "w": 25, "h": 36 },
    { "id": "6", "x": 33, "y": 12, "w": 28, "h": 10 },
    { "id": "20", "x": 82, "y": 6, "w": 16, "h": 23 }
  ]
}

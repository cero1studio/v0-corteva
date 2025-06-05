export async function addFreeKickGoal(formData: FormData) {
  const player = formData.get("player") as string
  const match = formData.get("match") as string

  if (!player || !match) {
    return {
      message: "Falta información para registrar el tiro libre.",
    }
  }

  try {
    // Simulate adding a free kick goal to a database
    console.log(`Tiro libre registrado para ${player} en el partido ${match}`)
    return { message: "Tiro libre registrado exitosamente." }
  } catch (e: any) {
    return { message: "Error al registrar el tiro libre." }
  }
}

export async function deleteFreeKickGoal(formData: FormData) {
  const id = formData.get("id") as string

  if (!id) {
    return {
      message: "Falta el ID del tiro libre a eliminar.",
    }
  }

  try {
    // Simulate deleting a free kick goal from a database
    console.log(`Tiro libre con ID ${id} eliminado`)
    return { message: "Tiro libre eliminado exitosamente." }
  } catch (e: any) {
    return { message: "Error al eliminar el tiro libre." }
  }
}

export async function getFreeKickGoals() {
  try {
    // Simulate fetching free kick goals from a database
    const freeKickGoals = [
      { id: "1", player: "Messi", match: "Argentina vs. France" },
      { id: "2", player: "Ronaldo", match: "Portugal vs. Spain" },
    ]
    return freeKickGoals
  } catch (e: any) {
    return { message: "Error al obtener los tiros libres." }
  }
}
